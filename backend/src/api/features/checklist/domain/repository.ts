import {
  PrismaClient,
  CheckListDocument,
  CheckListSet,
  getPrismaClient,
} from "../../../core/db";
import { NotFoundError } from "../../../core/errors";
import {
  CheckListItemEntity,
  CheckListItemDetail,
  CheckListSetSummary,
  CheckListSetEntity,
  CHECK_LIST_STATUS,
  CheckListSetDetailModel,
} from "./model/checklist";

export interface CheckRepository {
  storeCheckListSet(params: { checkListSet: CheckListSet }): Promise<void>;
  deleteCheckListSetById(params: { checkListSetId: string }): Promise<void>;
  findAllCheckListSets(
    status?: CHECK_LIST_STATUS
  ): Promise<CheckListSetSummary[]>;
  findCheckListItems(
    setId: string,
    parentId?: string,
    includeAllChildren?: boolean
  ): Promise<CheckListItemDetail[]>;
  findCheckListSetDetailById(setId: string): Promise<CheckListSetDetailModel>;
  storeCheckListItem(params: { item: CheckListItemEntity }): Promise<void>;
  bulkStoreCheckListItems(params: {
    items: CheckListItemEntity[];
  }): Promise<void>;
  updateDocumentStatus(params: {
    documentId: string;
    status: CHECK_LIST_STATUS;
  }): Promise<void>;
  findCheckListItemById(itemId: string): Promise<CheckListItemEntity>;
  validateParentItem(params: {
    parentItemId: string;
    setId: string;
  }): Promise<Boolean>;
  updateCheckListItem(params: { newItem: CheckListItemEntity }): Promise<void>;
  deleteCheckListItemById(params: { itemId: string }): Promise<void>;
  checkSetEditable(params: { setId: string }): Promise<boolean>;
}

export const makePrismaCheckRepository = async (
  clientInput: PrismaClient | null = null
): Promise<CheckRepository> => {
  const client = clientInput || (await getPrismaClient());

  const storeCheckListSet = async (params: {
    checkListSet: CheckListSetEntity;
  }): Promise<void> => {
    const { checkListSet } = params;
    const { id, name, description, documents } = checkListSet;

    await client.checkListSet.create({
      data: {
        id,
        name,
        description,
        documents: {
          create: documents.map((doc) => ({
            id: doc.id,
            filename: doc.filename,
            s3Path: doc.s3Key,
            fileType: doc.fileType,
            uploadDate: doc.uploadDate,
            status: doc.status,
          })),
        },
      },
    });
  };

  const deleteCheckListSetById = async (params: {
    checkListSetId: string;
  }): Promise<void> => {
    const { checkListSetId } = params;
    await client.$transaction(async (tx) => {
      await tx.checkList.deleteMany({ where: { checkListSetId } });
      await tx.checkListDocument.deleteMany({ where: { checkListSetId } });
      await tx.checkListSet.delete({ where: { id: checkListSetId } });
    });
  };

  const findAllCheckListSets = async (
    status?: CHECK_LIST_STATUS
  ): Promise<CheckListSetSummary[]> => {
    // ステータスフィルタリングのためのサブクエリを準備
    let whereCondition = {};

    console.log(
      `[Repository] findAllCheckListSets - requested status: ${status || "all"}`
    );

    // ステータスに基づいてフィルタリング条件を設定
    if (status) {
      switch (status) {
        case "completed":
          whereCondition = {
            documents: {
              some: {}, // ドキュメントが1つ以上存在するセットを取得
              every: { status: "completed" },
            },
          };
          console.log("[Repository] Using completed filter condition");
          break;
        case "processing":
          whereCondition = {
            documents: {
              some: { status: "processing" },
            },
          };
          console.log("[Repository] Using processing filter condition");
          break;
        case "pending":
          whereCondition = {
            documents: {
              none: { status: "processing" },
            },
          };
          console.log("[Repository] Using pending filter condition");
          break;
      }
    }

    const sets = await client.checkListSet.findMany({
      where: whereCondition,
      select: {
        id: true,
        name: true,
        description: true,
        // ドキュメントのステータスだけ取得
        documents: {
          select: { status: true },
        },
        _count: { select: { reviewJobs: true } },
      },
      orderBy: { id: "desc" },
    });

    const mappedSets = sets.map((s) => {
      const statuses = s.documents.map((d) => d.status as CHECK_LIST_STATUS);

      let processingStatus: CHECK_LIST_STATUS;
      if (statuses.length === 0) {
        processingStatus = CHECK_LIST_STATUS.PENDING;
      } else if (statuses.some((st) => st === CHECK_LIST_STATUS.PROCESSING)) {
        processingStatus = CHECK_LIST_STATUS.PROCESSING;
      } else if (statuses.every((st) => st === CHECK_LIST_STATUS.COMPLETED)) {
        processingStatus = CHECK_LIST_STATUS.COMPLETED;
      } else if (statuses.some((st) => st === CHECK_LIST_STATUS.FAILED)) {
        processingStatus = CHECK_LIST_STATUS.FAILED;
      } else {
        processingStatus = CHECK_LIST_STATUS.PENDING;
      }

      return {
        id: s.id,
        name: s.name,
        description: s.description ?? "",
        processingStatus,
        isEditable: s._count.reviewJobs === 0,
      };
    });

    return mappedSets;
  };

  const findCheckListItems = async (
    setId: string,
    parentId?: string,
    includeAllChildren?: boolean
  ): Promise<CheckListItemDetail[]> => {
    console.log(
      `[Repository] findCheckListItems - setId: ${setId}, parentId: ${
        parentId || "null"
      }, includeAllChildren: ${includeAllChildren}`
    );

    // クエリの基本条件を構築
    const whereCondition: any = {
      checkListSetId: setId,
    };

    // includeAllChildrenがfalseの場合のみ、parentIdの条件を適用
    if (!includeAllChildren) {
      whereCondition.parentId = parentId || null;
    }

    console.log(
      `[Repository] Query condition:`,
      JSON.stringify(whereCondition, null, 2)
    );

    // チェックリスト項目を取得
    const items = await client.checkList.findMany({
      where: whereCondition,
      select: {
        id: true,
        name: true,
        description: true,
        parentId: true,
        checkListSetId: true,
      },
      orderBy: { id: "asc" },
    });

    console.log(`[Repository] Found ${items.length} items`);

    if (items.length === 0) {
      return [];
    }

    // 子要素の有無を一括確認
    const itemIds = items.map((item) => item.id);

    console.log(`[Repository] Checking for children of itemIds:`, itemIds);

    // すべてのアイテムIDに対する子の存在を一度に確認する
    const childItems = await client.checkList.findMany({
      where: {
        checkListSetId: setId,
        parentId: {
          in: itemIds,
        },
      },
      select: {
        parentId: true,
      },
    });

    console.log(`[Repository] Found ${childItems.length} child items`);

    // 子を持つ親IDのセットを作成
    const parentsWithChildren = new Set(
      childItems.map((child) => child.parentId)
    );

    console.log(
      `[Repository] Parents with children:`,
      Array.from(parentsWithChildren)
    );

    // 結果を新しいモデル形式に変換して返す
    const mappedItems = items.map((item) => ({
      id: item.id,
      setId: item.checkListSetId,
      name: item.name,
      description: item.description ?? "",
      parentId: item.parentId ?? undefined,
      hasChildren: parentsWithChildren.has(item.id),
    }));

    console.log(
      `[Repository] Final items with hasChildren:`,
      mappedItems.map((i) => ({
        id: i.id,
        hasChildren: i.hasChildren,
      }))
    );

    return mappedItems;
  };

  const findCheckListSetDetailById = async (
    setId: string
  ): Promise<CheckListSetDetailModel> => {
    const checkListSet = await client.checkListSet.findUnique({
      where: { id: setId },
      include: {
        documents: true,
      },
    });

    if (!checkListSet) {
      throw new NotFoundError("CheckListSet not found", setId);
    }

    // チェックリストセットが編集可能かどうかを確認
    const isEditable = await checkSetEditable({ setId });

    return {
      id: checkListSet.id,
      name: checkListSet.name,
      description: checkListSet.description ?? "",
      documents: checkListSet.documents.map((doc) => ({
        id: doc.id,
        filename: doc.filename,
        s3Key: doc.s3Path,
        fileType: doc.fileType,
        uploadDate: doc.uploadDate,
        status: doc.status as CHECK_LIST_STATUS,
      })),
      isEditable,
    };
  };

  const storeCheckListItem = async (params: {
    item: CheckListItemEntity;
  }): Promise<void> => {
    const { item } = params;
    const { id, name, description, setId, parentId } = item;

    await client.checkList.create({
      data: {
        id,
        name,
        description,
        checkListSetId: setId,
        parentId: parentId,
      },
    });
  };

  const bulkStoreCheckListItems = async (params: {
    items: CheckListItemEntity[];
  }): Promise<void> => {
    const { items } = params;

    try {
      await client.checkList.createMany({
        data: items.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          parentId: item.parentId,
          checkListSetId: item.setId,
        })),
      });
    } catch (error) {
      throw error;
    }
  };

  const updateDocumentStatus = async (params: {
    documentId: string;
    status: CHECK_LIST_STATUS;
  }): Promise<void> => {
    const { documentId, status } = params;
    await client.checkListDocument.update({
      where: { id: documentId },
      data: { status },
    });
  };

  const findCheckListItemById = async (
    itemId: string
  ): Promise<CheckListItemEntity> => {
    const item = await client.checkList.findUnique({
      where: { id: itemId },
      select: {
        id: true,
        name: true,
        description: true,
        checkListSetId: true,
      },
    });

    if (!item) {
      throw new NotFoundError("Item not found", itemId);
    }

    return {
      id: item.id,
      setId: item.checkListSetId,
      name: item.name,
      description: item.description ?? "",
    };
  };

  const validateParentItem = async (params: {
    parentItemId: string;
    setId: string;
  }): Promise<Boolean> => {
    const parent = await client.checkList.findUnique({
      where: { id: params.parentItemId },
      select: {
        id: true,
        checkListSetId: true,
        documentId: true,
      },
    });
    if (!parent) {
      return false;
    }

    const belongsTo = parent.checkListSetId === params.setId;
    return belongsTo;
  };

  const updateCheckListItem = async (params: {
    newItem: CheckListItemEntity;
  }): Promise<void> => {
    const { newItem } = params;
    const { id, name, description } = newItem;

    await client.checkList.update({
      where: { id },
      data: {
        name,
        description,
      },
    });
  };

  const deleteCheckListItemById = async (params: {
    itemId: string;
  }): Promise<void> => {
    const { itemId } = params;

    // 子アイテムを再帰的に削除
    const childItems = await client.checkList.findMany({
      where: { parentId: itemId },
      select: { id: true },
    });

    for (const child of childItems) {
      await deleteCheckListItemById({ itemId: child.id });
    }

    // 自身を削除
    await client.checkList.delete({
      where: { id: itemId },
    });
  };

  const checkSetEditable = async (params: {
    setId: string;
  }): Promise<boolean> => {
    const { setId } = params;
    const count = await client.reviewJob.count({
      where: { checkListSetId: setId },
    });
    return count === 0;
  };

  return {
    storeCheckListSet,
    deleteCheckListSetById,
    findAllCheckListSets,
    findCheckListItems,
    findCheckListSetDetailById,
    storeCheckListItem,
    bulkStoreCheckListItems,
    updateDocumentStatus,
    findCheckListItemById,
    validateParentItem,
    updateCheckListItem,
    deleteCheckListItemById,
    checkSetEditable,
  };
};
