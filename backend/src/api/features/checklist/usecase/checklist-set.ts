import { CreateChecklistSetRequest } from "../routes/handlers";
import {
  CheckRepository,
  makePrismaCheckRepository,
} from "../domain/repository";
import {
  CheckListSetDomain,
  CheckListItemDetail,
  CheckListSetSummary,
  CheckListSetDetailModel,
  CHECK_LIST_STATUS,
} from "../domain/model/checklist";
import { ulid } from "ulid";
import { getPresignedUrl } from "../../../core/s3";
import { getChecklistOriginalKey } from "../../../../checklist-workflow/common/storage-paths";
import { ApplicationError } from "../../../core/errors";
import { startStateMachineExecution } from "../../../core/sfn";

export const createChecklistSet = async (params: {
  req: CreateChecklistSetRequest;
  deps?: {
    repo?: CheckRepository;
  };
}): Promise<void> => {
  const repo = params.deps?.repo || (await makePrismaCheckRepository());

  const { req } = params;
  const checkListSet = CheckListSetDomain.fromCreateRequest(req);
  await repo.storeCheckListSet({
    checkListSet,
  });

  const stateMachineArn = process.env.DOCUMENT_PROCESSING_STATE_MACHINE_ARN;
  if (!stateMachineArn) {
    throw new ApplicationError(
      "DOCUMENT_PROCESSING_STATE_MACHINE_ARN is not defined"
    );
  }

  // NOTE: Currently, only the first document is processed.
  if (req.documents.length === 0) {
    throw new ApplicationError("No documents found in the request");
  } else if (req.documents.length > 1) {
    throw new ApplicationError("Multiple documents are not supported");
  }
  const doc = req.documents[0];

  await startStateMachineExecution(stateMachineArn, {
    documentId: doc.documentId,
    fileName: doc.filename,
    checkListSetId: checkListSet.id,
  });
};

export const duplicateChecklistSet = async (params: {
  sourceCheckListSetId: string;
  newName?: string;
  newDescription?: string;
  deps?: {
    repo?: CheckRepository;
  };
}): Promise<void> => {
  const repo = params.deps?.repo || (await makePrismaCheckRepository());
  const { sourceCheckListSetId, newName, newDescription } = params;

  // 1. 元のチェックリストセットを取得
  const sourceCheckListSet =
    await repo.findCheckListSetDetailById(sourceCheckListSetId);

  // 2. 新しいチェックリストセットを作成
  const newCheckListSet = CheckListSetDomain.fromDuplicateRequest(
    sourceCheckListSetId,
    newName,
    newDescription,
    sourceCheckListSet
  );

  // 3. 新しいチェックリストセットを保存
  await repo.storeCheckListSet({
    checkListSet: newCheckListSet,
  });

  // 4. 元のチェックリストの項目を全て取得
  const sourceItems = await repo.findCheckListItems(
    sourceCheckListSetId,
    undefined,
    true // すべての子項目を含める
  );

  if (sourceItems.length === 0) {
    return; // 項目がなければ終了
  }

  // 5. IDマッピングを作成（古いID -> 新しいID）
  const idMapping = new Map<string, string>();
  sourceItems.forEach((item) => {
    idMapping.set(item.id, ulid());
  });

  // 6. 新しいチェックリスト項目を作成
  const newItems = sourceItems.map((item) => ({
    id: idMapping.get(item.id)!,
    setId: newCheckListSet.id,
    name: item.name,
    description: item.description || "",
    parentId: item.parentId ? idMapping.get(item.parentId) : undefined,
  }));

  // 7. 新しいチェックリスト項目を保存
  if (newItems.length > 0) {
    await repo.bulkStoreCheckListItems({ items: newItems });
  }
};

export const removeChecklistSet = async (params: {
  checkListSetId: string;
  deps?: {
    repo?: CheckRepository;
  };
}): Promise<void> => {
  const repo = params.deps?.repo || (await makePrismaCheckRepository());

  const { checkListSetId } = params;
  await repo.deleteCheckListSetById({
    checkListSetId,
  });
};

export const getAllChecklistSets = async (params: {
  status?: CHECK_LIST_STATUS;
  deps?: {
    repo?: CheckRepository;
  };
}): Promise<CheckListSetSummary[]> => {
  const repo = params.deps?.repo || (await makePrismaCheckRepository());

  const checkListSets = await repo.findAllCheckListSets(params.status);
  return checkListSets;
};

export const getCheckListDocumentPresignedUrl = async (params: {
  filename: string;
  contentType: string;
}): Promise<{ url: string; key: string; documentId: string }> => {
  const { filename, contentType } = params;
  const bucketName = process.env.DOCUMENT_BUCKET;
  if (!bucketName) {
    throw new Error("S3_BUCKET_NAME is not defined");
  }
  const documentId = ulid();
  const key = getChecklistOriginalKey(documentId, filename);
  const url = await getPresignedUrl(bucketName, key, contentType);

  return { url, key, documentId };
};

export const getChecklistItems = async (params: {
  checkListSetId: string;
  parentId?: string;
  includeAllChildren?: boolean;
  deps?: {
    repo?: CheckRepository;
  };
}): Promise<CheckListItemDetail[]> => {
  const repo = params.deps?.repo || (await makePrismaCheckRepository());

  const { checkListSetId, parentId, includeAllChildren } = params;
  const checkListItems = await repo.findCheckListItems(
    checkListSetId,
    parentId,
    includeAllChildren
  );
  return checkListItems;
};

export const getChecklistSetById = async (params: {
  checkListSetId: string;
  deps?: {
    repo?: CheckRepository;
  };
}): Promise<CheckListSetDetailModel> => {
  const repo = params.deps?.repo || (await makePrismaCheckRepository());
  const { checkListSetId } = params;
  const checkListSet = await repo.findCheckListSetDetailById(checkListSetId);
  return checkListSet;
};
