import { ulid } from "ulid";
import { NotFoundError } from "../../../../core/errors";
import { CheckRepository } from "../../../checklist/domain/repository";
import { CreateReviewJobRequest } from "../../routes/handlers";
import {
  REVIEW_RESULT_STATUS,
  REVIEW_JOB_STATUS,
  ReviewJobModel,
  ReviewResultModel,
  REVIEW_RESULT,
} from "../model/review";
import { ReviewJobRepository } from "../repository";

export const createInitialReviewJobModel = async (params: {
  req: CreateReviewJobRequest;
  deps: {
    checkRepo: CheckRepository;
  };
}): Promise<ReviewJobModel> => {
  const { req, deps } = params;
  const { checkRepo } = deps;

  const checkListSet = await checkRepo.findCheckListSetById(
    req.checkListSetId,
    null
  );

  if (checkListSet.length === 0) {
    throw new NotFoundError(`ChecklistSet not found`, req.checkListSetId);
  }

  const jobId = ulid();
  const initialResults = checkListSet.map((checkList) => {
    return createInitialReviewResult(jobId, checkList.id);
  });

  return {
    id: jobId,
    name: req.name,
    status: REVIEW_JOB_STATUS.PENDING,
    documentId: req.documentId,
    checkListSetId: req.checkListSetId,
    filename: req.filename,
    s3Key: req.s3Key,
    fileType: req.fileType,
    imageFiles: req.imageFiles,
    results: initialResults,
  };
};

const createInitialReviewResult = (
  reviewJobId: string,
  checkId: string
): ReviewResultModel => {
  return {
    id: ulid(),
    reviewJobId,
    checkId,
    status: REVIEW_RESULT_STATUS.PENDING,
    userOverride: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};
