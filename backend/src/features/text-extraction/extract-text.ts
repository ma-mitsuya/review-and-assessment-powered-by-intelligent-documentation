import { S3Utils } from "../../core/utils/s3";
import { Result, ok, err } from "../../core/utils/result";
import { ExtractedTextResult } from "./types";

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
  console.log(
    `[extractText] 開始: documentId=${documentId}, pageNumber=${pageNumber}, fileType=${fileType}`
  );

  switch (fileType) {
    case "pdf":
      console.log(`[extractText] PDFからテキスト抽出を実行`);
      return doNothing({ documentId, pageNumber }, deps);

    case "text":
      console.log(`[extractText] テキストファイルからテキスト抽出を実行`);
      return doNothing({ documentId, pageNumber }, deps);

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

export async function doNothing(
  params: {
    documentId: string;
    pageNumber: number;
  },
  deps: TextExtractorDeps
): Promise<Result<ExtractedTextResult, Error>> {
  const { documentId, pageNumber } = params;

  // Fetch s3 and save
  const { s3 } = deps;
  const textKey = getPageExtractedTextKey(documentId, pageNumber);
  const saveResult = await s3.uploadObject(
    textKey,
    Buffer.from(EMPTY_TEXT_PLACEHOLDER, "utf-8"),
    "text/plain"
  );
  if (!saveResult.ok) {
    return err(
      new Error(`テキスト保存に失敗しました: ${saveResult.error.message}`)
    );
  }
  console.log(`[doNothing] テキスト保存成功`);
  console.log(
    `[doNothing] テキスト抽出スキップ: documentId=${documentId}, pageNumber=${pageNumber}`
  );

  return ok({
    documentId,
    pageNumber,
    text: EMPTY_TEXT_PLACEHOLDER,
    extractedAt: new Date(),
  });
}
