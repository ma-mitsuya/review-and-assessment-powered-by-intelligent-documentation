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
  console.log(`[extractText] 開始: documentId=${documentId}, pageNumber=${pageNumber}, fileType=${fileType}`);

  switch (fileType) {
    case "pdf":
      console.log(`[extractText] PDFからテキスト抽出を実行`);
      return extractTextFromPdf({ documentId, pageNumber }, deps);

    case "text":
      console.log(`[extractText] テキストファイルからテキスト抽出を実行`);
      return extractTextFromText({ documentId, pageNumber }, deps);

    case "image":
      console.log(`[extractText] 画像ファイルはテキスト抽出をスキップ`);
      return ok({
        documentId,
        pageNumber,
        text: EMPTY_TEXT_PLACEHOLDER,
        extractedAt: new Date(),
      });

    case "word":
      console.error(`[extractText] Wordファイルのテキスト抽出は未実装`);
      return err(new Error("Wordファイルのテキスト抽出は未実装です"));
    case "excel":
      console.error(`[extractText] Excelファイルのテキスト抽出は未実装`);
      return err(new Error("Excelファイルのテキスト抽出は未実装です"));
    default:
      console.error(`[extractText] 未サポートのfileType: ${fileType}`);
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

  console.log(`[extractTextFromPdf] S3からPDFを取得: ${pageKey}`);
  const pdfBufferResult = await s3.getObject(pageKey);
  if (!pdfBufferResult.ok) {
    console.error(`[extractTextFromPdf] S3からのPDF取得失敗: ${pdfBufferResult.error.message}`);
    return err(pdfBufferResult.error);
  }
  console.log(`[extractTextFromPdf] S3からPDF取得成功: サイズ=${pdfBufferResult.value.length}バイト`);

  let text = "";
  try {
    // PDFを読み込み
    console.log(`[extractTextFromPdf] PDFドキュメント読み込み開始`);
    const pdf = await pdfLib.getDocument({
      data: Uint8Array.from(pdfBufferResult.value),
    }).promise;
    console.log(`[extractTextFromPdf] PDFドキュメント読み込み成功: ${pdf.numPages}ページ`);

    // ページを取得（ページ番号は1始まり）
    console.log(`[extractTextFromPdf] PDFページ取得開始`);
    const page = await pdf.getPage(1);
    console.log(`[extractTextFromPdf] PDFページ取得成功`);
    
    console.log(`[extractTextFromPdf] テキストコンテンツ取得開始`);
    const content = await page.getTextContent();
    console.log(`[extractTextFromPdf] テキストコンテンツ取得成功: ${content.items.length}アイテム`);

    // テキスト抽出
    text = content.items
      .map((item) => ("str" in item ? (item as any).str : ""))
      .filter(Boolean)
      .join("\n");
    
    console.log(`[extractTextFromPdf] テキスト抽出成功: ${text.length}文字`);
  } catch (error) {
    console.error(`[extractTextFromPdf] テキスト抽出エラー: ${error instanceof Error ? error.message : String(error)}`);
    return err(error instanceof Error ? error : new Error(String(error)));
  }

  // 結果を保存
  const textKey = getPageExtractedTextKey(documentId, pageNumber);
  console.log(`[extractTextFromPdf] テキスト保存開始: ${textKey}`);
  const saveResult = await s3.uploadObject(
    textKey,
    Buffer.from(text, "utf-8"),
    "text/plain"
  );

  if (!saveResult.ok) {
    console.error(`[extractTextFromPdf] テキスト保存失敗: ${saveResult.error.message}`);
    return err(
      new Error(`テキスト保存に失敗しました: ${saveResult.error.message}`)
    );
  }
  console.log(`[extractTextFromPdf] テキスト保存成功`);

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
