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
  const { documentId, fileName } = params;
  const { s3 } = deps;
  const originalKey = getOriginalDocumentKey(documentId, fileName);
  const fileType = getFileType(fileName);

  // S3から対象を取得
  const fileResult = await s3.getObject(originalKey);
  if (!fileResult.ok) return fileResult;

  // ページに分割
  const pagesResult = await splitIntoPages(
    { buffer: fileResult.value, fileType },
    { pdfLib: deps.pdfLib }
  );
  if (!pagesResult.ok) return pagesResult;

  // 各ページをS3にアップロード
  const uploadPromises = pagesResult.value.map((page) => {
    const pageKey = getPagePdfKey(documentId, page.pageNumber);
    return s3
      .uploadObject(pageKey, page.buffer, "application/pdf")
      .then((result) =>
        result.ok ? ok({ pageNumber: page.pageNumber }) : result
      );
  });

  // すべてのアップロード結果を集約
  const uploadResults = await allResults(uploadPromises);
  if (!uploadResults.ok) return uploadResults;

  // 成功した場合は結果を構築
  const pageInfos = uploadResults.value;
  const metadata: DocumentMetadata = {
    documentId,
    fileName,
    fileType,
    pageCount: pageInfos.length,
    extractedAt: new Date(),
    processingStatus: "processing",
  };

  return ok({
    documentId,
    metadata,
    pages: pageInfos,
    pageCount: pageInfos.length,
  });
}
