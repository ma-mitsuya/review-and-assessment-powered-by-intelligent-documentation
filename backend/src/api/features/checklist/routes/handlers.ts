import { FastifyReply, FastifyRequest } from "fastify";
import {
  createChecklistSet,
  removeChecklistSet,
  getAllChecklistSets,
  getCheckListDocumentPresignedUrl,
  getChecklistSetDetail,
} from "../usecase/checklist-set";
import { deleteS3Object } from "../../../core/s3";

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
export async function createChecklistSetHandler(
  request: FastifyRequest<{ Body: CreateChecklistSetRequest }>,
  reply: FastifyReply
): Promise<void> {
  await createChecklistSet({
    req: request.body,
  });

  reply.code(200).send({
    success: true,
    data: {},
  });
}

/**
 * チェックリストセット削除ハンドラー
 */
export async function deleteChecklistSetHandler(
  request: FastifyRequest<{ Params: { checklistSetId: string } }>,
  reply: FastifyReply
): Promise<void> {
  const { checklistSetId } = request.params;
  await removeChecklistSet({
    checkListSetId: checklistSetId,
  });
  reply.code(200).send({
    success: true,
    data: {},
  });
}

/**
 * チェックリストセット一覧取得ハンドラー
 */
export async function getAllChecklistSetsHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const checkLists = await getAllChecklistSets({});
  reply.code(200).send({
    success: true,
    data: {
      checkListSets: checkLists.map((checkList) => ({
        checkListSetId: checkList.id,
        name: checkList.name,
        description: checkList.description,
        processingStatus: checkList.processingStatus,
        isEditable: checkList.isEditable,
      })),
    },
  });
}

interface GetPresignedUrlRequest {
  filename: string;
  contentType: string;
}

export async function getChecklistPresignedUrlHandler(
  request: FastifyRequest<{ Body: GetPresignedUrlRequest }>,
  reply: FastifyReply
): Promise<void> {
  const { filename, contentType } = request.body;

  const result = await getCheckListDocumentPresignedUrl({
    filename,
    contentType,
  });

  reply.code(200).send({
    success: true,
    data: result,
  });
}

export async function deleteChecklistDocumentHandler(
  request: FastifyRequest<{ Params: { key: string } }>,
  reply: FastifyReply
): Promise<void> {
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
}

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
