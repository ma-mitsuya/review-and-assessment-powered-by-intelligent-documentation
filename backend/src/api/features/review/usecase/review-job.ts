import { ReviewJobDomain, ReviewJobMetaModel } from "../domain/model/review";
import {
  ReviewRepository,
  makePrismaReviewRepository,
} from "../domain/repository";
import { ulid } from "ulid";
import { getPresignedUrl } from "../../../core/s3";
import { getReviewDocumentKey } from "../../../../checklist-workflow/common/storage-paths";
import { CreateReviewJobRequest } from "../routes/handlers";

export const getAllReviewJobs = async (params: {
  deps?: {
    repo?: ReviewRepository;
  };
}): Promise<ReviewJobMetaModel[]> => {
  const repo = params.deps?.repo || makePrismaReviewRepository();
  const reviewJobs = await repo.findAllReviewJobs();
  return reviewJobs;
};

export const getReviewDocumentPresignedUrl = async (params: {
  filename: string;
  contentType: string;
}): Promise<{ url: string; key: string; documentId: string }> => {
  const { filename, contentType } = params;
  const bucketName = process.env.DOCUMENT_BUCKET;
  if (!bucketName) {
    throw new Error("S3_BUCKET_NAME is not defined");
  }
  const documentId = ulid();
  const key = getReviewDocumentKey(documentId, filename);
  const url = await getPresignedUrl(bucketName, key, contentType);

  return { url, key, documentId };
};

export const createReviewJob = async (params: {
  requestBody: CreateReviewJobRequest;
  deps?: {
    repo?: ReviewRepository;
  };
}): Promise<void> => {
  const repo = params.deps?.repo || makePrismaReviewRepository();
  const reviewJob = ReviewJobDomain.fromCreateRequest(params.requestBody);

  await repo.createReviewJob(reviewJob);
  return;
};

export const removeReviewJob = async (params: {
  reviewJobId: string;
  deps?: {
    repo?: ReviewRepository;
  };
}): Promise<void> => {
  const repo = params.deps?.repo || makePrismaReviewRepository();
  await repo.deleteReviewJobById({
    reviewJobId: params.reviewJobId,
  });
};
