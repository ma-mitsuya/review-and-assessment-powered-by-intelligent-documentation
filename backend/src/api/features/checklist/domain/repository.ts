import {
  PrismaClient,
  CheckListDocument,
  CheckListSet,
} from "../../../core/db";
import { prisma } from "../../../core/prisma";
import {
  CheckListItemModel,
  CheckListSetMetaModel,
  CheckListSetModel,
  CheckListStatus,
  ItemType,
} from "./model/checklist";

export interface CheckRepository {
  storeCheckListSet(params: { checkListSet: CheckListSet }): Promise<void>;
  deleteCheckListSetById(params: { checkListSetId: string }): Promise<void>;
  findAllCheckListSets(): Promise<CheckListSetMetaModel[]>;
  findCheckListSetById(
    setId: string,
    rootItemId: string | null
  ): Promise<CheckListItemModel[]>;
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
      orderBy: { id: "desc" }, // 必要に応じてソート条件を調整
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
    rootItemId: string | null
  ): Promise<CheckListItemModel[]> => {
    // 1) 当該セットの全アイテムを取得
    const rawItems = await client.checkList.findMany({
      where: { checkListSetId: setId },
      select: {
        id: true,
        name: true,
        description: true,
        parentId: true,
        itemType: true,
        isConclusion: true,
      },
      orderBy: { id: "asc" }, // ソートは任意
    });

    // 2) Map に変換して children を初期化
    const map: Record<
      string,
      CheckListItemModel & { children: CheckListItemModel[] }
    > = {};
    for (const item of rawItems) {
      map[item.id] = {
        id: item.id,
        name: item.name,
        description: item.description ?? "",
        itemType: item.itemType as ItemType,
        isConclusion: item.isConclusion,
        children: [],
      };
    }

    // 3) 親子関係を組み立て
    const roots: (CheckListItemModel & { children: CheckListItemModel[] })[] =
      [];
    for (const item of rawItems) {
      const node = map[item.id];
      if (item.parentId && map[item.parentId]) {
        map[item.parentId].children.push(node);
      } else {
        // parentId が null または 親が見つからないものは一旦 roots
        roots.push(node);
      }
    }

    // 4) 指定された rootItemId 以下のツリーを返す
    if (rootItemId) {
      const rootNode = map[rootItemId];
      return rootNode ? rootNode.children : [];
    }

    // rootItemId が null ならトップレベルを返却
    return roots;
  };

  return {
    storeCheckListSet,
    deleteCheckListSetById,
    findAllCheckListSets,
    findCheckListSetById,
  };
};
