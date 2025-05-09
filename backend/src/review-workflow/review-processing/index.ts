import { PrismaClient } from "../../api/core/db";
import { getPrismaClient } from "../../api/core/db";
import { ReviewJobRepository } from "../../api/features/review_old/repositories/review-job-repository";
import { ReviewResultRepository } from "../../api/features/review_old/repositories/review-result-repository";
import { ChecklistSetRepository } from "../../api/features/checklist/repositories/checklist-set-repository";
import { ChecklistItemRepository } from "../../api/features/checklist/repositories/checklist-item-repository";
import { generateId } from "../../api/core/utils/id-generator";
import {
  REVIEW_JOB_STATUS,
  REVIEW_RESULT_STATUS,
  REVIEW_RESULT,
} from "../../api/features/review_old/constants";

/**
 * 審査準備パラメータ
 */
interface PrepareReviewParams {
  reviewJobId: string;
  documentId: string;
  fileName: string;
}

/**
 * 審査結果集計パラメータ
 */
interface FinalizeReviewParams {
  reviewJobId: string;
  processedItems: any[];
}

/**
 * 審査準備処理
 * チェックリスト項目を取得し、処理項目を準備する
 */
export async function prepareReview(params: PrepareReviewParams): Promise<any> {
  const { reviewJobId, documentId, fileName } = params;
  const prisma = getPrismaClient();
  const jobRepository = new ReviewJobRepository(prisma);
  const resultRepository = new ReviewResultRepository(prisma);
  const checklistSetRepository = new ChecklistSetRepository(prisma);
  const checklistItemRepository = new ChecklistItemRepository(prisma);

  try {
    // 審査ジョブの取得
    const reviewJob = await jobRepository.getReviewJob(reviewJobId);
    if (!reviewJob) {
      throw new Error(`Review job not found: ${reviewJobId}`);
    }

    // チェックリストセットの取得
    const checkListSet = await checklistSetRepository.getChecklistSetById(
      reviewJob.checkListSetId
    );
    if (!checkListSet) {
      throw new Error(`CheckList set not found: ${reviewJob.checkListSetId}`);
    }

    // チェックリスト項目の取得
    const checkLists = await checklistItemRepository.getChecklistItemHierarchy(
      reviewJob.checkListSetId
    );

    if (checkLists.length === 0) {
      throw new Error(
        `No check list items found for set: ${reviewJob.checkListSetId}`
      );
    }

    // 各チェックリスト項目に対して審査結果IDを生成
    const checkItems: Array<{ checkId: string; reviewResultId: string }> = [];
    const now = new Date();

    // トランザクションで一括処理
    await prisma.$transaction(async (tx) => {
      // 全ての項目を初期化
      for (const checkList of checkLists) {
        const reviewResultId = generateId();

        // 審査結果の初期レコードを作成
        await tx.reviewResult.create({
          data: {
            id: reviewResultId,
            reviewJobId,
            checkId: checkList.id,
            status: REVIEW_RESULT_STATUS.PROCESSING,
            userOverride: false,
            createdAt: now,
            updatedAt: now,
          },
        });

        // 処理項目を追加
        checkItems.push({
          checkId: checkList.id,
          reviewResultId,
        });
      }
    });

    // ジョブのステータスを処理中に更新
    await jobRepository.updateReviewJobStatus(
      reviewJobId,
      REVIEW_JOB_STATUS.PROCESSING
    );

    return {
      reviewJobId,
      documentId,
      fileName,
      checkItems,
    };
  } catch (error) {
    console.error(`Error preparing review job ${reviewJobId}:`, error);
    // エラー発生時はジョブのステータスを失敗に更新
    await jobRepository.updateReviewJobStatus(
      reviewJobId,
      REVIEW_JOB_STATUS.FAILED
    );
    throw error;
  }
}

/**
 * 審査結果集計処理
 * 審査結果を集計し、親子関係の結果を更新する
 */
export async function finalizeReview(
  params: FinalizeReviewParams
): Promise<any> {
  const { reviewJobId, processedItems } = params;
  const prisma = getPrismaClient();
  const jobRepository = new ReviewJobRepository(prisma);
  const resultRepository = new ReviewResultRepository(prisma);
  const checklistItemRepository = new ChecklistItemRepository(prisma);

  try {
    // 審査結果の取得
    const results = await resultRepository.getReviewResultsByJobId(reviewJobId);

    // 結果からチェックIDを抽出
    const checkIds = results.map((result) => result.checkId);

    // チェックリスト項目の取得
    const checkLists = await Promise.all(
      checkIds.map((id) => checklistItemRepository.getChecklistItem(id))
    );

    // nullを除外
    const validCheckLists = checkLists.filter(Boolean);

    // 親子関係のマッピングを作成
    const childrenMap = new Map<string, string[]>();
    validCheckLists.forEach((checkList) => {
      if (checkList && checkList.parentId) {
        if (!childrenMap.has(checkList.parentId)) {
          childrenMap.set(checkList.parentId, []);
        }
        childrenMap.get(checkList.parentId)?.push(checkList.id);
      }
    });

    // 親子関係の結果を更新
    await updateParentResults(reviewJobId, results, childrenMap, prisma);

    // ジョブのステータスを完了に更新
    await jobRepository.updateReviewJobStatus(
      reviewJobId,
      REVIEW_JOB_STATUS.COMPLETED
    );

    return {
      status: "success",
      reviewJobId,
      message: "Review processing completed",
    };
  } catch (error) {
    console.error(`Error finalizing review job ${reviewJobId}:`, error);
    // エラー発生時はジョブのステータスを失敗に更新
    await jobRepository.updateReviewJobStatus(
      reviewJobId,
      REVIEW_JOB_STATUS.FAILED
    );
    throw error;
  }
}

/**
 * 親項目の結果を更新する
 * 子項目の結果に基づいて親項目の結果を更新する
 */
async function updateParentResults(
  reviewJobId: string,
  results: any[],
  childrenMap: Map<string, string[]>,
  prisma: PrismaClient
): Promise<void> {
  // 結果をマッピング
  const resultMap = new Map<string, any>();
  results.forEach((result) => {
    resultMap.set(result.checkId, result);
  });

  // 親項目を処理
  const processedParents = new Set<string>();
  const resultRepository = new ReviewResultRepository(prisma);

  // トランザクションで一括処理
  await prisma.$transaction(async (tx) => {
    for (const [parentId, childIds] of childrenMap.entries()) {
      if (processedParents.has(parentId)) continue;

      const parentResult = resultMap.get(parentId);
      if (!parentResult) continue;

      // 子項目の結果を取得
      const childResults = childIds
        .map((childId) => resultMap.get(childId))
        .filter(Boolean);

      // 子項目がすべて完了しているか確認
      const allCompleted = childResults.every(
        (result) => result.status === REVIEW_RESULT_STATUS.COMPLETED
      );

      if (allCompleted) {
        // 子項目がすべてパスしているか確認
        const allPassed = childResults.every(
          (result) => result.result === REVIEW_RESULT.PASS
        );

        // 親項目の結果を更新
        await resultRepository.updateReviewResult(parentResult.id, {
          status: REVIEW_RESULT_STATUS.COMPLETED,
          result: allPassed ? REVIEW_RESULT.PASS : REVIEW_RESULT.FAIL,
          confidenceScore: calculateAverageConfidence(childResults),
          explanation: generateParentExplanation(childResults, allPassed),
        });

        processedParents.add(parentId);
      }
    }
  });
}

/**
 * 子項目の信頼度スコアの平均を計算する
 */
function calculateAverageConfidence(childResults: any[]): number {
  if (childResults.length === 0) return 0;
  const sum = childResults.reduce(
    (acc, result) => acc + (result.confidenceScore || 0),
    0
  );
  return sum / childResults.length;
}

/**
 * 親項目の説明文を生成する
 */
function generateParentExplanation(
  childResults: any[],
  allPassed: boolean
): string {
  if (allPassed) {
    return "すべての子項目が適合しています。";
  } else {
    const failedItems = childResults
      .filter((result) => result.result === REVIEW_RESULT.FAIL)
      .map((result) => result.checkList?.name || "不明な項目")
      .join("、");
    return `以下の子項目が不適合です: ${failedItems}`;
  }
}
