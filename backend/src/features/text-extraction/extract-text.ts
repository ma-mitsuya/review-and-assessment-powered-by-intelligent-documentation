import { S3Utils } from "../../core/utils/s3";
import { Result, ok, err } from "../../core/utils/result";
import { ExtractedTextResult } from "./types";
import {
  PDFDocumentProxy,
  TextContent,
} from "pdfjs-dist/types/src/display/api";
import { FileType } from "../../core/utils/file";
import {
  getPageExtractedTextKey,
  getPagePdfKey,
} from "../common/storage-paths";

const EMPTY_TEXT_PLACEHOLDER = "";

/**
 * テキスト抽出に必要な依存関係
 */
export interface TextExtractorDeps {
  s3: S3Utils;
  pdfLib: {
    getDocument: (params: { data: Uint8Array }) => {
      promise: Promise<PDFDocumentProxy>;
    };
  };
}

/**
 * ドキュメントからテキストを抽出する
 */
export async function extractText(
  params: {
    documentId: string;
    pageNumber: number;
    fileType: FileType;
  },
  deps: TextExtractorDeps
): Promise<Result<ExtractedTextResult, Error>> {
  const { documentId, pageNumber, fileType } = params;

  switch (fileType) {
    case "pdf":
      return extractTextFromPdf({ documentId, pageNumber }, deps);

    case "text":
      return extractTextFromText({ documentId, pageNumber }, deps);

    case "image":
      return ok({
        documentId,
        pageNumber,
        text: EMPTY_TEXT_PLACEHOLDER,
        extractedAt: new Date(),
      });

    case "word":
      return err(new Error("Wordファイルのテキスト抽出は未実装です"));
    case "excel":
      return err(new Error("Excelファイルのテキスト抽出は未実装です"));
    default:
      return err(new Error(`未サポートのfileType: ${fileType}`));
  }
}

/**
 * PDFからテキストを抽出する
 */
export async function extractTextFromPdf(
  params: {
    documentId: string;
    pageNumber: number;
  },
  deps: TextExtractorDeps
): Promise<Result<ExtractedTextResult, Error>> {
  const { documentId, pageNumber } = params;
  const pageKey = getPagePdfKey(documentId, pageNumber);
  const { s3, pdfLib } = deps;

  const pdfBufferResult = await s3.getObject(pageKey);
  if (!pdfBufferResult.ok) return err(pdfBufferResult.error);

  let text = "";
  try {
    // PDFを読み込み
    const pdf = await pdfLib.getDocument({
      data: Uint8Array.from(pdfBufferResult.value),
    }).promise;

    // ページを取得（ページ番号は1始まり）
    const page = await pdf.getPage(1);
    const content = await page.getTextContent();

    // テキスト抽出
    text = content.items
      .map((item) => ("str" in item ? (item as any).str : ""))
      .filter(Boolean)
      .join("\n");
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }

  // 結果を保存
  const textKey = getPageExtractedTextKey(documentId, pageNumber);
  const saveResult = await s3.uploadObject(
    textKey,
    Buffer.from(text, "utf-8"),
    "text/plain"
  );

  if (!saveResult.ok) {
    return err(
      new Error(`テキスト保存に失敗しました: ${saveResult.error.message}`)
    );
  }

  return ok({
    documentId,
    pageNumber,
  });
}

/**
 * テキストファイルからテキストを抽出する
 */
export async function extractTextFromText(
  params: {
    documentId: string;
    pageNumber: number;
  },
  deps: TextExtractorDeps
): Promise<Result<ExtractedTextResult, Error>> {
  const { documentId, pageNumber } = params;
  const pageKey = getPagePdfKey(documentId, pageNumber);
  const { s3 } = deps;

  const textResult = await s3.getObject(pageKey);
  if (!textResult.ok) return err(textResult.error);

  const text = textResult.value.toString("utf-8");

  // テキスト用のキーを生成して保存
  const textKey = getPageExtractedTextKey(documentId, pageNumber);
  const saveResult = await s3.uploadObject(
    textKey,
    Buffer.from(text, "utf-8"),
    "text/plain"
  );

  if (!saveResult.ok) {
    return err(
      new Error(`テキスト保存に失敗しました: ${saveResult.error.message}`)
    );
  }

  return ok({
    documentId,
    pageNumber,
    text,
    extractedAt: new Date(),
  });
}
