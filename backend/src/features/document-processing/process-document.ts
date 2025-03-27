import { Result, ok, err } from "../../core/utils/result";
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
  params: {
    documentId: string;
    fileName: string;
  },
  deps: {
    s3: S3Utils;
    pdfLib: {
      PDFDocument: typeof PDFDocument;
    };
  }
): Promise<Result<DocumentProcessResult, Error>> {
  try {
    const { documentId, fileName } = params;
    const { s3 } = deps;

    const originalKey = getOriginalDocumentKey(documentId, fileName);
    const fileType = getFileType(fileName);

    // 元ファイルをS3から取得
    const fileBufferResult = await s3.getObject(originalKey);
    if (!fileBufferResult.ok) return err(fileBufferResult.error);
    const fileBuffer = fileBufferResult.value;

    // ページ分割
    const splitPagesResult = await splitIntoPages(
      {
        buffer: fileBuffer,
        fileType,
      },
      {
        pdfLib: {
          PDFDocument,
        },
      }
    );
    if (!splitPagesResult.ok) return err(splitPagesResult.error);

    const splitPages = splitPagesResult.value;

    // 並列でアップロードを行う
    const uploadResults = await Promise.all(
      splitPages.map(async (page) => {
        const pageKey = getPagePdfKey(documentId, page.pageNumber);
        const result = await s3.uploadObject(
          pageKey,
          page.buffer,
          "application/pdf"
        );
        return {
          pageNumber: page.pageNumber,
          result,
        };
      })
    );

    const failed = uploadResults.find((r) => !r.result.ok);
    if (failed) {
      return err(
        new Error(`ページ${failed.pageNumber}のアップロードに失敗しました`)
      );
    }

    const pageInfos: DocumentProcessResult["pages"] = uploadResults.map(
      (r) => ({
        pageNumber: r.pageNumber,
      })
    );

    const metadata: DocumentMetadata = {
      documentId,
      fileName,
      fileType,
      pageCount: splitPages.length,
      extractedAt: new Date(),
      processingStatus: "processing",
    };

    return ok({
      documentId,
      metadata,
      pages: pageInfos,
      pageCount: splitPages.length,
    });
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
