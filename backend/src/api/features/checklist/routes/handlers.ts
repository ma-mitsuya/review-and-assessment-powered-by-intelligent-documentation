import { FastifyReply, FastifyRequest } from "fastify";
import {
  createChecklistSet,
  removeChecklistSet,
  getAllChecklistSets,
  getCheckListDocumentPresignedUrl,
  getChecklistSetDetail,
} from "../usecase/checklist-set";
import { deleteS3Object } from "../../../core/s3";
import {
  createChecklistItem,
  getCheckListItem,
  modifyCheckListItem,
  removeCheckListItem,
} from "../usecase/checklist-item";

interface Document {
  documentId: string;
  filename: string;
  s3Key: string;
  fileType: string;
}

/**
 * チェックリストセット作成リクエストの型定義
 */
export interface CreateChecklistSetRequest {
  name: string;
  description?: string;
  documents: Document[];
}

/**
 * チェックリストセット作成ハンドラー
 */
export const createChecklistSetHandler = async (
  request: FastifyRequest<{ Body: CreateChecklistSetRequest }>,
  reply: FastifyReply
): Promise<void> => {
  await createChecklistSet({
    req: request.body,
  });

  reply.code(200).send({
    success: true,
    data: {},
  });
};

/**
 * チェックリストセット削除ハンドラー
 */
export const deleteChecklistSetHandler = async (
  request: FastifyRequest<{ Params: { checklistSetId: string } }>,
  reply: FastifyReply
): Promise<void> => {
  const { checklistSetId } = request.params;
  await removeChecklistSet({
    checkListSetId: checklistSetId,
  });
  reply.code(200).send({
    success: true,
    data: {},
  });
};

/**
 * チェックリストセット一覧取得ハンドラー
 */
export const getAllChecklistSetsHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const checkLists = await getAllChecklistSets({});
  reply.code(200).send({
    success: true,
    data: {
      total: checkLists.length,
      checkListSets: checkLists.map((checkList) => ({
        checkListSetId: checkList.id,
        name: checkList.name,
        description: checkList.description,
        processingStatus: checkList.processingStatus,
        isEditable: checkList.isEditable,
      })),
    },
  });
};

interface GetPresignedUrlRequest {
  filename: string;
  contentType: string;
}

export const getChecklistPresignedUrlHandler = async (
  request: FastifyRequest<{ Body: GetPresignedUrlRequest }>,
  reply: FastifyReply
): Promise<void> => {
  const { filename, contentType } = request.body;

  const result = await getCheckListDocumentPresignedUrl({
    filename,
    contentType,
  });

  reply.code(200).send({
    success: true,
    data: result,
  });
};

export const deleteChecklistDocumentHandler = async (
  request: FastifyRequest<{ Params: { key: string } }>,
  reply: FastifyReply
): Promise<void> => {
  const { key } = request.params;
  const bucketName = process.env.DOCUMENT_BUCKET;
  if (!bucketName) {
    throw new Error("Bucket name is not defined");
  }

  await deleteS3Object(bucketName, key);

  reply.code(200).send({
    success: true,
    data: {
      deleted: true,
    },
  });
};

export async function getChecklistSetDetailHandler(
  request: FastifyRequest<{ Params: { setId: string } }>,
  reply: FastifyReply
): Promise<void> {
  const { setId } = request.params;
  const detail = await getChecklistSetDetail({
    checkListSetId: setId,
    rootItemId: null,
  });

  reply.code(200).send({
    success: true,
    data: {
      detail,
    },
  });
}

export const getChecklistItemHandler = async (
  request: FastifyRequest<{ Params: { setId: string; itemId: string } }>,
  reply: FastifyReply
): Promise<void> => {
  const { itemId } = request.params;
  const detail = await getCheckListItem({
    itemId,
  });

  reply.code(200).send({
    success: true,
    data: {
      detail,
    },
  });
};

/**
 * チェックリスト項目作成リクエストの型定義
 */
export interface CreateChecklistItemRequest {
  Params: {
    setId: string;
  };
  Body: {
    name: string;
    description?: string;
    parentId?: string;
  };
}

export const createChecklistItemHandler = async (
  request: FastifyRequest<CreateChecklistItemRequest>,
  reply: FastifyReply
): Promise<void> => {
  await createChecklistItem({
    req: {
      Params: request.params,
      Body: request.body,
    },
  });

  reply.code(200).send({
    success: true,
    data: {},
  });
};

export interface UpdateChecklistItemRequest {
  Params: {
    setId: string;
    itemId: string;
  };
  Body: {
    name: string;
    description: string;
  };
}

export const updateChecklistItemHandler = async (
  request: FastifyRequest<UpdateChecklistItemRequest>,
  reply: FastifyReply
): Promise<void> => {
  const { setId, itemId } = request.params;
  const { name, description } = request.body;

  await modifyCheckListItem({
    req: {
      Params: { setId, itemId },
      Body: { name, description },
    },
  });

  reply.code(200).send({
    success: true,
    data: {},
  });
};

export const deleteChecklistItemHandler = async (
  request: FastifyRequest<{ Params: { setId: string; itemId: string } }>,
  reply: FastifyReply
): Promise<void> => {
  const { setId, itemId } = request.params;
  await removeCheckListItem({
    setId,
    itemId,
  });
  reply.code(200).send({
    success: true,
    data: {},
  });
};
