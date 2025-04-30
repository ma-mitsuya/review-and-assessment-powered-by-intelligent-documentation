import { prepareReview, finalizeReview } from "./review-processing";
import { processReviewItem } from "./review-processing/review-item-processor";
import { ReviewJobRepository } from "../api/features/review/repositories/review-job-repository";
import { REVIEW_JOB_STATUS } from "../api/features/review/constants";

export const handler = async (event: any): Promise<any> => {
  console.log("受信イベント:", JSON.stringify(event, null, 2));

  // アクションタイプに基づいて処理を分岐
  switch (event.action) {
    case "prepareReview":
      return await handlePrepareReview(event);
    case "processReviewItem":
      return await handleProcessReviewItem(event);
    case "finalizeReview":
      return await handleFinalizeReview(event);
    case "handleReviewError":
      return await handleReviewError(event);
    default:
      throw new Error(`未知のアクション: ${event.action}`);
  }
};

/**
 * 審査準備ハンドラー
 */
async function handlePrepareReview(event: any) {
  return await prepareReview({
    reviewJobId: event.reviewJobId,
    documentId: event.documentId,
    fileName: event.fileName,
  });
}

/**
 * 審査項目処理ハンドラー
 */
async function handleProcessReviewItem(event: any) {
  return await processReviewItem({
    reviewJobId: event.reviewJobId,
    documentId: event.documentId,
    fileName: event.fileName,
    checkId: event.checkId,
    reviewResultId: event.reviewResultId,
  });
}

/**
 * 審査結果集計ハンドラー
 */
async function handleFinalizeReview(event: any) {
  return await finalizeReview({
    reviewJobId: event.reviewJobId,
    processedItems: event.processedItems,
  });
}

/**
 * エラーハンドリングハンドラー
 */
async function handleReviewError(event: any) {
  console.error("審査エラー発生:", event.error);
  console.error("エラー詳細:", event.cause);
  
  // ジョブステータスをエラーに更新
  const jobRepository = new ReviewJobRepository();
  await jobRepository.updateReviewJobStatus(
    event.reviewJobId,
    REVIEW_JOB_STATUS.FAILED
  );
  
  return {
    status: "error",
    error: event.error,
    cause: event.cause,
    reviewJobId: event.reviewJobId,
  };
}
