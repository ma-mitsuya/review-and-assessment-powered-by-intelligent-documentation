import { CreateChecklistSetRequest } from "../routes/handlers";
import {
  CheckRepository,
  makePrismaCheckRepository,
} from "../domain/repository";
import {
  CheckListDomain,
  CheckListItemModel,
  CheckListSetMetaModel,
} from "../domain/model/checklist";
import { ulid } from "ulid";
import { getPresignedUrl } from "../../../core/s3";
import { getChecklistOriginalKey } from "../../../../checklist-workflow/common/storage-paths";

export const createChecklistSet = async (params: {
  req: CreateChecklistSetRequest;
  deps?: {
    repo?: CheckRepository;
  };
}): Promise<void> => {
  const repo = params.deps?.repo || makePrismaCheckRepository();

  const { req } = params;
  const { name, description, documents } = req;

  const checkListSet = CheckListDomain.fromUploadedDocuments({
    name,
    description,
    documents: documents.map((doc) => ({
      id: doc.documentId,
      filename: doc.filename,
      s3Key: doc.s3Key,
      fileType: doc.fileType,
    })),
  });

  await repo.storeCheckListSet({
    checkListSet,
  });
};

export const removeChecklistSet = async (params: {
  checkListSetId: string;
  deps?: {
    repo?: CheckRepository;
  };
}): Promise<void> => {
  const repo = params.deps?.repo || makePrismaCheckRepository();

  const { checkListSetId } = params;
  await repo.deleteCheckListSetById({
    checkListSetId,
  });
};

export const getAllChecklistSets = async (params: {
  deps?: {
    repo?: CheckRepository;
  };
}): Promise<CheckListSetMetaModel[]> => {
  const repo = params.deps?.repo || makePrismaCheckRepository();

  const checkListSets = await repo.findAllCheckListSets();
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

export const getChecklistSetDetail = async (params: {
  checkListSetId: string;
  rootItemId: string | null;
  deps?: {
    repo?: CheckRepository;
  };
}): Promise<CheckListItemModel[]> => {
  const repo = params.deps?.repo || makePrismaCheckRepository();

  const { checkListSetId, rootItemId } = params;
  const checkListSet = await repo.findCheckListSetById(
    checkListSetId,
    rootItemId
  );
  return checkListSet;
};
