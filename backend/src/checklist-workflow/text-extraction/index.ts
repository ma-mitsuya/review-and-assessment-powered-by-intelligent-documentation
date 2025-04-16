/**
 * テキスト抽出処理
 * 注: 現在の実装では空文字列を保存するだけ
 */
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getChecklistExtractedTextKey } from "../common/storage-paths";
import { ExtractTextResult } from "../common/types";

export interface ExtractTextParams {
  documentId: string;
  pageNumber: number;
}

/**
 * テキストを抽出する（現在は空文字列を保存するだけ）
 * @param params テキスト抽出パラメータ
 * @returns 抽出結果
 */
export async function extractText({
  documentId,
  pageNumber,
}: ExtractTextParams): Promise<ExtractTextResult> {
  const s3Client = new S3Client({});
  const bucketName = process.env.DOCUMENT_BUCKET || '';
  
  // 空文字列を保存
  const textContent = "";
  const textKey = getChecklistExtractedTextKey(documentId, pageNumber);
  
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: textKey,
      Body: textContent,
      ContentType: "text/plain",
    })
  );

  return {
    documentId,
    pageNumber,
    textContent,
  };
}
