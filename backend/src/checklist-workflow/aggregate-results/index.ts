/**
 * ページ結果の集計処理
 */
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getChecklistAggregateKey } from "../common/storage-paths";
import { ChecklistItem, AggregatePageResult } from "../common/types";
import { ulid } from "ulid";

export interface AggregatePageResultsParams {
  documentId: string;
  processedPages: {
    Payload: {
      documentId: string;
      pageNumber: number;
      checklistItems: ChecklistItem[];
    };
  }[];
}

/**
 * ページ結果を集計する
 * @param params 集計パラメータ
 * @returns 集計結果
 */
export async function aggregatePageResults({
  documentId,
  processedPages,
}: AggregatePageResultsParams): Promise<AggregatePageResult> {
  const s3Client = new S3Client({});
  const bucketName = process.env.DOCUMENT_BUCKET || '';
  
  // 各ページの結果を統合
  const allChecklistItems: ChecklistItem[] = [];
  
  // 各ページごとに処理
  for (const page of processedPages) {
    const pageNumber = page.Payload.pageNumber;
    const pageItems = page.Payload.checklistItems;
    
    // 数値IDからULIDへのマッピングを作成
    const idMapping: Record<string, string> = {};
    
    // 各項目にULIDを割り当て
    for (let i = 0; i < pageItems.length; i++) {
      const item = pageItems[i];
      const newId = ulid();
      idMapping[i] = newId;
      
      // 項目をコピー
      const newItem = { ...item };
      
      // parent_idの変換
      if (newItem.parent_id !== null && newItem.parent_id !== undefined) {
        newItem.parent_id = idMapping[newItem.parent_id] || null;
      }
      
      // flow_dataの変換
      if (newItem.flow_data) {
        if (newItem.flow_data.next_if_yes !== undefined) {
          newItem.flow_data.next_if_yes = idMapping[newItem.flow_data.next_if_yes];
        }
        if (newItem.flow_data.next_if_no !== undefined) {
          newItem.flow_data.next_if_no = idMapping[newItem.flow_data.next_if_no];
        }
        if (newItem.flow_data.next_options) {
          const newOptions: Record<string, string> = {};
          for (const [key, value] of Object.entries(newItem.flow_data.next_options)) {
            newOptions[key] = idMapping[value];
          }
          newItem.flow_data.next_options = newOptions;
        }
      }
      
      allChecklistItems.push(newItem);
    }
  }
  
  // 結果をS3に保存
  const aggregateKey = getChecklistAggregateKey(documentId);
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: aggregateKey,
      Body: JSON.stringify(allChecklistItems),
      ContentType: "application/json",
    })
  );

  return {
    documentId,
    checklistItems: allChecklistItems,
  };
}
