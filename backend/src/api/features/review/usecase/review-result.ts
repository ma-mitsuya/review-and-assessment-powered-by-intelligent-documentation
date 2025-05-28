import {
  REVIEW_RESULT,
  ReviewResultDetail,
  ReviewResultDomain,
} from "../domain/model/review";
import {
  ReviewResultRepository,
  makePrismaReviewResultRepository,
} from "../domain/repository";
import { updateCheckResultCascade } from "../domain/service/review-result-cascade-update";

export const getReviewResults = async (params: {
  reviewJobId: string;
  parentId?: string;
  filter?: REVIEW_RESULT;
  includeAllChildren?: boolean;
  deps?: {
    repo?: ReviewResultRepository;
  };
}): Promise<ReviewResultDetail[]> => {
  const repo = params.deps?.repo || (await makePrismaReviewResultRepository());
  const reviewJob = await repo.findReviewResultsById({
    jobId: params.reviewJobId,
    parentId: params.parentId,
    filter: params.filter,
    includeAllChildren: params.includeAllChildren || false,
  });
  return reviewJob;
};

export const overrideReviewResult = async (params: {
  reviewJobId: string;
  resultId: string;
  result: REVIEW_RESULT;
  userComment: string;
  deps?: {
    repo?: ReviewResultRepository;
  };
}): Promise<void> => {
  const repo = params.deps?.repo || (await makePrismaReviewResultRepository());

  const current = await repo.findDetailedReviewResultById({
    resultId: params.resultId,
  });
  const updated = ReviewResultDomain.fromOverrideRequest({
    current,
    result: params.result,
    userComment: params.userComment,
  });

  await updateCheckResultCascade({
    updated,
    deps: {
      reviewResultRepo: repo,
    },
  });
};
