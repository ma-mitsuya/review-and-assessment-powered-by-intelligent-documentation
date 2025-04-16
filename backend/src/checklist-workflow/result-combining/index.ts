/**
 * ページ結果の結合処理
 */
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getChecklistCombinedKey } from "../common/storage-paths";
import { ChecklistItem, CombinePageResult } from "../common/types";

export interface CombinePageResultsParams {
  parallelResults: {
    textExtraction: {
      Payload: {
        documentId: string;
        pageNumber: number;
        textContent: string;
      };
    };
    llmProcessing: {
      Payload: {
        documentId: string;
        pageNumber: number;
        checklistItems: ChecklistItem[];
      };
    };
  };
}

/**
 * ページ結果を結合する
 * @param params 結合パラメータ
 * @returns 結合結果
 */
export async function combinePageResults({
  parallelResults,
}: CombinePageResultsParams): Promise<CombinePageResult> {
  const s3Client = new S3Client({});
  const bucketName = process.env.DOCUMENT_BUCKET || '';
  
  const { documentId, pageNumber } = parallelResults.llmProcessing.Payload;
  const checklistItems = parallelResults.llmProcessing.Payload.checklistItems;
  
  // 結果をS3に保存
  const combinedKey = getChecklistCombinedKey(documentId, pageNumber);
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: combinedKey,
      Body: JSON.stringify(checklistItems),
      ContentType: "application/json",
    })
  );

  return {
    documentId,
    pageNumber,
    checklistItems,
  };
}
