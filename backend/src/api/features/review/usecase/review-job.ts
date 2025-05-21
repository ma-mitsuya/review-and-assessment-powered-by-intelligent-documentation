import {
  REVIEW_FILE_TYPE,
  REVIEW_JOB_STATUS,
  REVIEW_RESULT,
  REVIEW_RESULT_STATUS,
  ReviewJobMetaModel,
  ReviewJobDetailModel,
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
import { getReviewDocumentKey, getReviewImageKey } from "../../../../checklist-workflow/common/storage-paths";
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

export const getReviewImagesPresignedUrl = async (params: {
  filenames: string[];
  contentTypes: string[];
}): Promise<{ documentId: string; files: Array<{ url: string; key: string; filename: string; index: number }> }> => {
  const { filenames, contentTypes } = params;
  const bucketName = process.env.DOCUMENT_BUCKET;
  if (!bucketName) {
    throw new Error("S3_BUCKET_NAME is not defined");
  }

  if (filenames.length > 20) {
    throw new ApplicationError("Maximum 20 image files allowed");
  }

  const documentId = ulid();
  const results = await Promise.all(
    filenames.map(async (filename, index) => {
      const contentType = contentTypes[index];
      const key = getReviewImageKey(documentId, filename, index);
      const url = await getPresignedUrl(bucketName, key, contentType);
      return { url, key, filename, index };
    })
  );

  return {
    documentId,
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
  const checkRepo = params.deps?.checkRepo || makePrismaCheckRepository();
  const reviewJobRepo =
    params.deps?.reviewJobRepo || makePrismaReviewJobRepository();

  // Validate file types
  if (params.requestBody.fileType === REVIEW_FILE_TYPE.IMAGE &&
    (!params.requestBody.imageFiles || params.requestBody.imageFiles.length === 0)) {
    throw new ApplicationError("Image files are required for image file type");
  }

  if (params.requestBody.fileType === REVIEW_FILE_TYPE.IMAGE &&
    params.requestBody.imageFiles!.length > 20) {
    throw new ApplicationError("Maximum 20 image files allowed");
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
    documentId: reviewJob.documentId,
    fileName: reviewJob.filename,
    fileType: reviewJob.fileType,
    imageFiles: reviewJob.fileType === REVIEW_FILE_TYPE.IMAGE ? reviewJob.imageFiles : [], // PDF の場合は空配列
  });
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
export const getReviewJobById = async (params: {
  reviewJobId: string;
  deps?: {
    repo?: ReviewJobRepository;
  };
}): Promise<ReviewJobDetailModel> => {
  const repo = params.deps?.repo || makePrismaReviewJobRepository();
  return await repo.findReviewJobById({
    reviewJobId: params.reviewJobId,
  });
};
