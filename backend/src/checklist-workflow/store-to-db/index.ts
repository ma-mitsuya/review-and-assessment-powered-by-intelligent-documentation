/**
 * チェックリスト項目をRDBに格納する
 */
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getChecklistAggregateKey } from "../common/storage-paths";
import { ParsedChecklistItem } from "../common/types";
import { makePrismaCheckRepository } from "../../api/features/checklist/domain/repository";
import { CheckListItemDomain } from "../../api/features/checklist/domain/model/checklist";

export interface StoreToDbParams {
  documentId: string;
  checkListSetId: string;
}

export interface StoreToDbResult {
  documentId: string;
  checkListSetId: string;
  success: boolean;
}

/**
 * S3から集約されたチェックリスト項目を取得してRDBに格納する
 * @param params パラメータ
 * @returns 処理結果
 */
export async function storeChecklistItemsToDb({
  documentId,
  checkListSetId,
}: StoreToDbParams): Promise<StoreToDbResult> {
  const s3Client = new S3Client({});
  const bucketName = process.env.DOCUMENT_BUCKET || "";
  const checkRepo = makePrismaCheckRepository();

  try {
    // S3から集約結果を取得
    const aggregateKey = getChecklistAggregateKey(documentId);
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: aggregateKey,
      })
    );

    const bodyContents = await response.Body?.transformToString();
    if (!bodyContents) {
      throw new Error(`S3オブジェクトの内容が空です: ${aggregateKey}`);
    }

    const parsedItems: ParsedChecklistItem[] = JSON.parse(bodyContents);

    const items = parsedItems.map((parsedItem) => {
      return CheckListItemDomain.fromParsedChecklistItem({
        item: parsedItem,
        setId: checkListSetId,
      });
    });

    await checkRepo.bulkStoreCheckListItems({
      items,
    });
    await checkRepo.updateDocumentStatus({
      documentId,
      status: "completed",
    });

    // // トランザクションでRDBに格納
    // let storedItemCount = 0;
    // await prisma.$transaction(async (tx) => {
    //   const txRepository = new ChecklistItemRepository(tx as any);

    //   for (const item of checklistItems) {
    //     // 型変換が不要になった
    //     const flowData: FlowData | undefined = item.flow_data
    //       ? {
    //           condition_type: item.flow_data.condition_type,
    //           next_if_yes: item.flow_data.next_if_yes,
    //           next_if_no: item.flow_data.next_if_no,
    //           next_options: item.flow_data.next_options,
    //         }
    //       : undefined;

    //     await txRepository.createChecklistItem({
    //       id: item.id,
    //       name: item.name,
    //       description: item.description,
    //       parentId: item.parent_id,
    //       itemType: item.item_type.toLowerCase() as "simple" | "flow",
    //       isConclusion: item.is_conclusion,
    //       flowData,
    //       checkListSetId: checkListSetId,
    //       documentId: documentId,
    //     });
    //     storedItemCount++;
    //   }

    //   // ドキュメントのステータスを "completed" に更新
    //   await tx.checkListDocument.update({
    //     where: { id: documentId },
    //     data: { status: "completed" },
    //   });
    // });

    return {
      documentId,
      checkListSetId,
      success: true,
    };
  } catch (error) {
    console.error(`RDBへの格納に失敗しました: ${error}`);
    throw new Error(`チェックリスト項目のRDBへの格納に失敗しました: ${error}`);
  }
}
