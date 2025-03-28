import { Result, ok, err, allResults } from "../../core/utils/result";
import { DocumentMetadata, DocumentProcessResult } from "./types";
import { splitIntoPages } from "./split-pages";
import { getFileType, FileType } from "../../core/utils/file";
import { S3Utils } from "../../core/utils/s3";
import { getOriginalDocumentKey, getPagePdfKey } from "../common/storage-paths";
import { PDFDocument } from "pdf-lib";

/**
 * ドキュメントを処理し、ページ分割を行う
 *
 * @param params 処理に必要なパラメータ
 * @param deps 外部依存関係
 * @returns 処理結果
 */
export async function processDocument(
  params: { documentId: string; fileName: string },
  deps: { s3: S3Utils; pdfLib: { PDFDocument: typeof PDFDocument } }
): Promise<Result<DocumentProcessResult, Error>> {
  console.log(
    `[processDocument] 開始: documentId=${params.documentId}, fileName=${params.fileName}`
  );
  const { documentId, fileName } = params;
  const { s3 } = deps;
  const originalKey = getOriginalDocumentKey(documentId, fileName);
  const fileType = getFileType(fileName);

  console.log(
    `[processDocument] ファイルタイプ: ${fileType}, S3キー: ${originalKey}`
  );

  // S3から対象を取得
  console.log(`[processDocument] S3からファイル取得開始: ${originalKey}`);
  const fileResult = await s3.getObject(originalKey);
  if (!fileResult.ok) {
    console.error(
      `[processDocument] S3からのファイル取得失敗: ${fileResult.error.message}`
    );
    return fileResult;
  }
  console.log(
    `[processDocument] S3からファイル取得成功: サイズ=${fileResult.value.length}バイト`
  );

  // ページに分割
  console.log(`[processDocument] ページ分割処理開始`);
  const pagesResult = await splitIntoPages(
    { buffer: fileResult.value, fileType },
    { pdfLib: deps.pdfLib }
  );
  if (!pagesResult.ok) {
    console.error(
      `[processDocument] ページ分割処理失敗: ${pagesResult.error.message}`
    );
    return pagesResult;
  }
  console.log(
    `[processDocument] ページ分割処理成功: ${pagesResult.value.length}ページ`
  );

  // 各ページをS3にアップロード
  console.log(`[processDocument] 分割ページのS3アップロード開始`);
  const uploadPromises = pagesResult.value.map((page) => {
    const pageKey = getPagePdfKey(documentId, page.pageNumber);
    console.log(
      `[processDocument] ページ${page.pageNumber}のアップロード: ${pageKey}`
    );
    return s3
      .uploadObject(pageKey, page.buffer, "application/pdf")
      .then((result) => {
        if (!result.ok) {
          console.error(
            `[processDocument] ページ${page.pageNumber}のアップロード失敗: ${result.error.message}`
          );
          return result;
        }
        console.log(
          `[processDocument] ページ${page.pageNumber}のアップロード成功`
        );
        return ok({ pageNumber: page.pageNumber });
      });
  });

  // すべてのアップロード結果を集約
  console.log(`[processDocument] すべてのページアップロード結果を集約`);
  const uploadResults = await allResults(uploadPromises);
  if (!uploadResults.ok) {
    console.error(
      `[processDocument] ページアップロード集約でエラー: ${uploadResults.error.message}`
    );
    return uploadResults;
  }

  // 成功した場合は結果を構築
  const pageInfos = uploadResults.value;
  const metadata: DocumentMetadata = {
    documentId,
    fileName,
    fileType,
    // fileType: "pdf", // 暫定。TODO: 後続の処理で毎回fileTypeを判定する
    pageCount: pageInfos.length,
    extractedAt: new Date(),
    processingStatus: "processing",
  };

  console.log(
    `[processDocument] 処理完了: documentId=${documentId}, ページ数=${pageInfos.length}`
  );
  return ok({
    documentId,
    metadata,
    pages: pageInfos,
    pageCount: pageInfos.length,
  });
}
