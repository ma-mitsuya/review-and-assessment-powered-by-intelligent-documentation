/**
 * ページ結果の結合処理 - llmProcessingの結果のみ保存
 */
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import {
  getChecklistCombinedKey,
  getChecklistLlmOcrTextKey,
} from "../common/storage-paths";
import { CombinePageResult } from "../common/types";

export interface CombinePageResultsParams {
  parallelResults: any[]; // 配列として受け取る
}

/**
 * ページ結果を結合する (llmProcessingのみ)
 */
export async function combinePageResults({
  parallelResults, // 配列として受け取る
}: CombinePageResultsParams): Promise<CombinePageResult> {
  const s3Client = new S3Client({});
  const bucketName = process.env.DOCUMENT_BUCKET || "";

  console.log(
    "結合処理開始: パラレル結果数:",
    parallelResults?.length || "undefined"
  );

  // llmProcessingを含む結果を探す
  const llmResult = parallelResults.find((result) => result.llmProcessing);

  if (!llmResult) {
    throw new Error("llmProcessing結果が見つかりません");
  }

  const documentId = llmResult.documentId;
  const pageNumber = llmResult.pageNumber;

  console.log(
    `ページ ${pageNumber} の処理を開始: ドキュメントID ${documentId}`
  );

  // llmProcessingの結果を取得
  const llmOcrTextKey = getChecklistLlmOcrTextKey(documentId, pageNumber);
  const response = await s3Client.send(
    new GetObjectCommand({
      Bucket: bucketName,
      Key: llmOcrTextKey,
    })
  );
  const bodyContents = await response.Body?.transformToString();
  if (!bodyContents) {
    throw new Error(`S3オブジェクトの内容が空です: ${llmOcrTextKey}`);
  }
  const llmOcrText = JSON.parse(bodyContents);
  if (!llmOcrText) {
    throw new Error(`llmOcrTextが見つかりません: ${llmOcrTextKey}`);
  }
  console.log(
    `llmOcrTextを取得しました: ${llmOcrTextKey}, 内容: ${JSON.stringify(
      llmOcrText
    )}`
  );

  // llmOcrTextをJSON形式で保存
  const combinedKey = getChecklistCombinedKey(documentId, pageNumber);
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: combinedKey,
      Body: JSON.stringify(llmOcrText),
      ContentType: "application/json",
    })
  );

  console.log(`llmProcessing結果を保存しました: ${combinedKey}`);

  return {
    documentId,
    pageNumber,
  };
}
