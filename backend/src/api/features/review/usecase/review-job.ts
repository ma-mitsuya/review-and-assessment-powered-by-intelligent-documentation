import {
  REVIEW_FILE_TYPE,
  REVIEW_JOB_STATUS,
  REVIEW_RESULT,
  REVIEW_RESULT_STATUS,
  ReviewJobSummary,
  ReviewJobDetail,
  ReviewResultDetail,
} from "../domain/model/review";
import {
  ReviewJobRepository,
  ReviewResultRepository,
  makePrismaReviewJobRepository,
  makePrismaReviewResultRepository,
} from "../domain/repository";
import { ulid } from "ulid";
import { getPresignedUrl } from "../../../core/s3";
import {
  getReviewDocumentKey,
  getReviewImageKey,
} from "../../../../checklist-workflow/common/storage-paths";
import { CreateReviewJobRequest } from "../routes/handlers";
import { createInitialReviewJobModel } from "../domain/service/review-job-factory";
import {
  CheckRepository,
  makePrismaCheckRepository,
} from "../../checklist/domain/repository";
import { ApplicationError } from "../../../core/errors";
import { startStateMachineExecution } from "../../../core/sfn";

export const getAllReviewJobs = async (params: {
  deps?: {
    repo?: ReviewJobRepository;
  };
}): Promise<ReviewJobSummary[]> => {
  const repo = params.deps?.repo || (await makePrismaReviewJobRepository());
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

export const getReviewImagesPresignedUrl = async (params: {
  filenames: string[];
  contentTypes: string[];
}): Promise<{
  files: Array<{
    url: string;
    key: string;
    filename: string;
    documentId: string;
  }>;
}> => {
  const { filenames, contentTypes } = params;
  const bucketName = process.env.DOCUMENT_BUCKET;
  if (!bucketName) {
    throw new Error("S3_BUCKET_NAME is not defined");
  }

  if (filenames.length > 20) {
    throw new ApplicationError("Maximum 20 image files allowed");
  }

  const results = await Promise.all(
    filenames.map(async (filename, index) => {
      const contentType = contentTypes[index];
      const documentId = ulid();
      const key = getReviewImageKey(documentId, filename);
      const url = await getPresignedUrl(bucketName, key, contentType);
      return { url, key, filename, documentId };
    })
  );

  return {
    files: results,
  };
};

export const createReviewJob = async (params: {
  requestBody: CreateReviewJobRequest;
  deps?: {
    checkRepo?: CheckRepository;
    reviewJobRepo?: ReviewJobRepository;
  };
}): Promise<void> => {
  const checkRepo =
    params.deps?.checkRepo || (await makePrismaCheckRepository());
  const reviewJobRepo =
    params.deps?.reviewJobRepo || (await makePrismaReviewJobRepository());

  // バリデーション
  if (
    !params.requestBody.documents ||
    params.requestBody.documents.length === 0
  ) {
    throw new ApplicationError("At least one document is required");
  }

  if (params.requestBody.documents.length > 20) {
    throw new ApplicationError("Maximum 20 documents allowed");
  }

  const reviewJob = await createInitialReviewJobModel({
    req: params.requestBody,
    deps: {
      checkRepo,
    },
  });

  await reviewJobRepo.createReviewJob(reviewJob);

  const stateMachineArn = process.env.REVIEW_PROCESSING_STATE_MACHINE_ARN;
  if (!stateMachineArn) {
    throw new ApplicationError(
      "REVIEW_PROCESSING_STATE_MACHINE_ARN is not defined"
    );
  }

  // Invoke the state machine with file type information
  await startStateMachineExecution(stateMachineArn, {
    reviewJobId: reviewJob.id,
    // 最初のドキュメントの情報を渡す（処理開始用）
    documentId: reviewJob.documents[0].id,
    fileName: reviewJob.documents[0].filename,
    fileType: reviewJob.documents[0].fileType,
  });
};

export const removeReviewJob = async (params: {
  reviewJobId: string;
  deps?: {
    repo?: ReviewJobRepository;
  };
}): Promise<void> => {
  const repo = params.deps?.repo || (await makePrismaReviewJobRepository());
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
  const repo = params.deps?.repo || (await makePrismaReviewJobRepository());
  await repo.updateJobStatus({
    reviewJobId: params.reviewJobId,
    status: params.status,
  });
};
export const getReviewJobById = async (params: {
  reviewJobId: string;
  deps?: {
    repo?: ReviewJobRepository;
  };
}): Promise<ReviewJobDetail> => {
  const repo = params.deps?.repo || (await makePrismaReviewJobRepository());
  return await repo.findReviewJobById({
    reviewJobId: params.reviewJobId,
  });
};
