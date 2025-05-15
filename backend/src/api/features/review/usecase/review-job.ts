import {
  REVIEW_JOB_STATUS,
  REVIEW_RESULT,
  ReviewJobMetaModel,
  ReviewResultDetailModel,
} from "../domain/model/review";
import {
  ReviewJobRepository,
  ReviewResultRepository,
  makePrismaReviewJobRepository,
  makePrismaReviewResultRepository,
} from "../domain/repository";
import { ulid } from "ulid";
import { getPresignedUrl } from "../../../core/s3";
import { getReviewDocumentKey } from "../../../../checklist-workflow/common/storage-paths";
import { CreateReviewJobRequest } from "../routes/handlers";
import { createInitialReviewJobModel } from "../domain/service/review-job-factory";
import {
  CheckRepository,
  makePrismaCheckRepository,
} from "../../checklist/domain/repository";

export const getAllReviewJobs = async (params: {
  deps?: {
    repo?: ReviewJobRepository;
  };
}): Promise<ReviewJobMetaModel[]> => {
  const repo = params.deps?.repo || makePrismaReviewJobRepository();
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
    checkRepo?: CheckRepository;
    reviewJobRepo?: ReviewJobRepository;
  };
}): Promise<void> => {
  const checkRepo = params.deps?.checkRepo || makePrismaCheckRepository();
  const reviewJobRepo =
    params.deps?.reviewJobRepo || makePrismaReviewJobRepository();

  const reviewJob = await createInitialReviewJobModel({
    req: params.requestBody,
    deps: {
      checkRepo,
    },
  });

  await reviewJobRepo.createReviewJob(reviewJob);
  return;
};

export const removeReviewJob = async (params: {
  reviewJobId: string;
  deps?: {
    repo?: ReviewJobRepository;
  };
}): Promise<void> => {
  const repo = params.deps?.repo || makePrismaReviewJobRepository();
  await repo.deleteReviewJobById({
    reviewJobId: params.reviewJobId,
  });
};

export const modifyJobStatus = async (params: {
  reviewJobId: string;
  status: REVIEW_JOB_STATUS;
  deps?: {
    repo?: ReviewJobRepository;
  };
}): Promise<void> => {
  const repo = params.deps?.repo || makePrismaReviewJobRepository();
  await repo.updateJobStatus({
    reviewJobId: params.reviewJobId,
    status: params.status,
  });
};

export const getReviewResults = async (params: {
  reviewJobId: string;
  parentId?: string;
  filter?: REVIEW_RESULT;
  deps?: {
    repo?: ReviewResultRepository;
  };
}): Promise<ReviewResultDetailModel[]> => {
  const repo = params.deps?.repo || makePrismaReviewResultRepository();
  const reviewJob = await repo.findReviewResultsById({
    jobId: params.reviewJobId,
    parentId: params.parentId,
    filter: params.filter,
  });
  return reviewJob;
};
