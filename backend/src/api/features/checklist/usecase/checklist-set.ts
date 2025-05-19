import { CreateChecklistSetRequest } from "../routes/handlers";
import {
  CheckRepository,
  makePrismaCheckRepository,
} from "../domain/repository";
import {
  CheckListSetDomain,
  CheckListItemModel,
  CheckListSetMetaModel,
} from "../domain/model/checklist";
import { ulid } from "ulid";
import { getPresignedUrl } from "../../../core/s3";
import { getChecklistOriginalKey } from "../../../../checklist-workflow/common/storage-paths";
import { ApplicationError, NotFoundError } from "../../../core/errors";
import { startStateMachineExecution } from "../../../core/sfn";

export const createChecklistSet = async (params: {
  req: CreateChecklistSetRequest;
  deps?: {
    repo?: CheckRepository;
  };
}): Promise<void> => {
  const repo = params.deps?.repo || makePrismaCheckRepository();

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
