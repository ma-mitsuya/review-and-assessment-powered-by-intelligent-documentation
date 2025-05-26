import { REVIEW_JOB_STATUS } from "../../api/features/review/domain/model/review";
import { makePrismaReviewJobRepository } from "../../api/features/review/domain/repository";

export const reviewErrorHandler = async (event: any) => {
  const reviewJobRepository = await makePrismaReviewJobRepository();

  try {
    await reviewJobRepository.updateJobStatus({
      reviewJobId: event.reviewJobId,
      status: REVIEW_JOB_STATUS.FAILED,
    });
  } catch (error) {
    console.error("Failed to handle error:", error);
  }
};
