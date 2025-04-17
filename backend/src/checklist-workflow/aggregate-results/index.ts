/**
 * ページ結果の集計処理
 */
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import {
  getChecklistAggregateKey,
  getChecklistCombinedKey,
} from "../common/storage-paths";
import { ChecklistItem, AggregatePageResult } from "../common/types";
import { ulid } from "ulid";

export interface AggregatePageResultsParams {
  documentId: string;
  processedPages: {
    documentId: string;
    pageNumber: number;
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
  const bucketName = process.env.DOCUMENT_BUCKET || "";

  // 各ページの結果を統合
  const allChecklistItems: ChecklistItem[] = [];

  // 各ページごとに処理
  for (const page of processedPages) {
    const pageNumber = page.pageNumber;

    // S3から結合済み結果を取得
    const combinedKey = getChecklistCombinedKey(documentId, pageNumber);
    let pageItems: ChecklistItem[];

    try {
      const response = await s3Client.send(
        new GetObjectCommand({
          Bucket: bucketName,
          Key: combinedKey,
        })
      );

      const bodyContents = await response.Body?.transformToString();
      if (!bodyContents) {
        throw new Error(`S3オブジェクトの内容が空です: ${combinedKey}`);
      }

      pageItems = JSON.parse(bodyContents);
    } catch (error) {
      console.error(`S3から結合結果の取得に失敗しました: ${error}`);
      throw new Error(
        `ページ ${pageNumber} の結合結果の取得に失敗しました: ${error}`
      );
    }

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
          newItem.flow_data.next_if_yes =
            idMapping[newItem.flow_data.next_if_yes];
        }
        if (newItem.flow_data.next_if_no !== undefined) {
          newItem.flow_data.next_if_no =
            idMapping[newItem.flow_data.next_if_no];
        }
        if (newItem.flow_data.next_options) {
          const newOptions: Record<string, string> = {};
          for (const [key, value] of Object.entries(
            newItem.flow_data.next_options
          )) {
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
  };
}
