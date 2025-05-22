import {
  PrismaClient,
  CheckListDocument,
  CheckListSet,
} from "../../../core/db";
import { NotFoundError } from "../../../core/errors";
import { prisma } from "../../../core/prisma";
import {
  CheckListItemModel,
  CheckListItemDetailModel,
  CheckListSetMetaModel,
  CheckListSetModel,
  CheckListStatus,
} from "./model/checklist";

export interface CheckRepository {
  storeCheckListSet(params: { checkListSet: CheckListSet }): Promise<void>;
  deleteCheckListSetById(params: { checkListSetId: string }): Promise<void>;
  findAllCheckListSets(): Promise<CheckListSetMetaModel[]>;
  findCheckListSetById(
    setId: string,
    parentId?: string,
    includeAllChildren?: boolean
  ): Promise<CheckListItemDetailModel[]>;
  storeCheckListItem(params: { item: CheckListItemModel }): Promise<void>;
  bulkStoreCheckListItems(params: {
    items: CheckListItemModel[];
  }): Promise<void>;
  updateDocumentStatus(params: {
    documentId: string;
    status: CheckListStatus;
  }): Promise<void>;
  findCheckListItemById(itemId: string): Promise<CheckListItemModel>;
  validateParentItem(params: {
    parentItemId: string;
    setId: string;
  }): Promise<Boolean>;
  updateCheckListItem(params: { newItem: CheckListItemModel }): Promise<void>;
  deleteCheckListItemById(params: { itemId: string }): Promise<void>;
  checkSetEditable(params: { setId: string }): Promise<boolean>;
}

export const makePrismaCheckRepository = (
  client: PrismaClient = prisma
): CheckRepository => {
  const storeCheckListSet = async (params: {
    checkListSet: CheckListSetModel;
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

  const findAllCheckListSets = async (): Promise<CheckListSetMetaModel[]> => {
    const sets = await client.checkListSet.findMany({
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

    return sets.map((s) => {
      const statuses = s.documents.map((d) => d.status as CheckListStatus);

      let processingStatus: CheckListStatus;
      if (statuses.length === 0) {
        processingStatus = "pending";
      } else if (statuses.some((st) => st === "processing")) {
        processingStatus = "processing";
      } else if (statuses.every((st) => st === "completed")) {
        processingStatus = "completed";
      } else {
        processingStatus = "pending";
      }

      return {
        id: s.id,
        name: s.name,
        description: s.description ?? "",
        processingStatus,
        isEditable: s._count.reviewJobs === 0,
      };
    });
  };

  const findCheckListSetById = async (
    setId: string,
    parentId?: string,
    includeAllChildren?: boolean
  ): Promise<CheckListItemDetailModel[]> => {
    console.log(
      `[Repository] findCheckListSetById - setId: ${setId}, parentId: ${
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

    console.log(`[Repository] Query condition:`, JSON.stringify(whereCondition, null, 2));

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

    console.log(`[Repository] Parents with children:`, Array.from(parentsWithChildren));

    // 結果を新しいモデル形式に変換して返す
    const mappedItems = items.map((item) => ({
      id: item.id,
      setId: item.checkListSetId,
      name: item.name,
      description: item.description ?? "",
      parentId: item.parentId ?? undefined,
      hasChildren: parentsWithChildren.has(item.id),
    }));

    console.log(`[Repository] Final items with hasChildren:`, 
      mappedItems.map(i => ({ 
        id: i.id, 
        hasChildren: i.hasChildren 
      }))
    );

    return mappedItems;
  };

  const storeCheckListItem = async (params: {
    item: CheckListItemModel;
  }): Promise<void> => {
    const { item } = params;
    const { id, name, description, setId } = item;

    await client.checkList.create({
      data: {
        id,
        name,
        description,
        checkListSetId: setId,
      },
    });
  };

  const bulkStoreCheckListItems = async (params: {
    items: CheckListItemModel[];
  }): Promise<void> => {
    const { items } = params;

    await client.checkList.createMany({
      data: items.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        parentId: item.parentId,
        checkListSetId: item.setId,
      })),
    });
  };

  const updateDocumentStatus = async (params: {
    documentId: string;
    status: CheckListStatus;
  }): Promise<void> => {
    const { documentId, status } = params;
    await client.checkListDocument.update({
      where: { id: documentId },
      data: { status },
    });
  };

  const findCheckListItemById = async (
    itemId: string
  ): Promise<CheckListItemModel> => {
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
    newItem: CheckListItemModel;
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
    await client.checkList.delete({
      where: { id: itemId },
    });
  };

  const checkSetEditable = async (params: {
    setId: string;
  }): Promise<boolean> => {
    const { setId } = params;
    const set = await client.checkListSet.findUnique({
      where: { id: setId },
      select: { reviewJobs: { select: { id: true } } },
    });
    if (!set) {
      throw new NotFoundError("Set not found", setId);
    }
    return set.reviewJobs.length === 0;
  };

  return {
    storeCheckListSet,
    deleteCheckListSetById,
    findAllCheckListSets,
    findCheckListSetById,
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
