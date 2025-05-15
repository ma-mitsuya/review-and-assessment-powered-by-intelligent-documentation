import { FastifyReply, FastifyRequest } from "fastify";
import {
  createReviewJob,
  getAllReviewJobs,
  getReviewDocumentPresignedUrl,
  getReviewResults,
  removeReviewJob,
} from "../usecase/review-job";
import { deleteS3Object } from "../../../core/s3";
import { REVIEW_RESULT } from "../domain/model/review";

export const getAllReviewJobsHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const jobs = await getAllReviewJobs({});
  reply.code(200).send({
    success: true,
    data: jobs,
  });
};

interface GetPresignedUrlRequest {
  filename: string;
  contentType: string;
}

export const getReviewPresignedUrlHandler = async (
  request: FastifyRequest<{ Body: GetPresignedUrlRequest }>,
  reply: FastifyReply
): Promise<void> => {
  const { filename, contentType } = request.body;

  const result = await getReviewDocumentPresignedUrl({
    filename,
    contentType,
  });

  reply.code(200).send({
    success: true,
    data: result,
  });
};

export const deleteReviewDocumentHandler = async (
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

export interface CreateReviewJobRequest {
  name: string;
  documentId: string;
  checkListSetId: string;
  filename: string;
  s3Key: string;
  fileType: string;
  userId?: string;
}

export const createReviewJobHandler = async (
  request: FastifyRequest<{ Body: CreateReviewJobRequest }>,
  reply: FastifyReply
): Promise<void> => {
  await createReviewJob({
    requestBody: request.body,
  });
  reply.code(201).send({
    success: true,
    data: {},
  });
};

export const deleteReviewJobHandler = async (
  request: FastifyRequest<{ Params: { jobId: string } }>,
  reply: FastifyReply
): Promise<void> => {
  const { jobId } = request.params;
  await removeReviewJob({
    reviewJobId: jobId,
  });
  reply.code(200).send({
    success: true,
    data: {},
  });
};

export const getReviewResultItemsHandler = async (
  request: FastifyRequest<{
    Params: { jobId: string };
    Querystring: { parentId?: string; filter?: string };
  }>,
  reply: FastifyReply
): Promise<void> => {
  const results = await getReviewResults({
    reviewJobId: request.params.jobId,
    parentId: request.query.parentId,
    filter: request.query.filter
      ? (request.query.filter as REVIEW_RESULT)
      : undefined,
  });
  reply.code(200).send({
    success: true,
    data: results,
  });
};
