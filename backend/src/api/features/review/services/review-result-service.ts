/**
 * 審査結果サービス
 */
import { ReviewResultRepository } from "../repositories/review-result-repository";
import { ReviewJobRepository } from "../repositories/review-job-repository";
import {
  ReviewResultDto,
  ReviewResultItemDto,
  ReviewResultHierarchyDto,
  UpdateReviewResultParams,
} from "../types";
import { getPrismaClient } from "../../../core/db";

/**
 * 審査結果サービス
 */
export class ReviewResultService {
  private resultRepository: ReviewResultRepository;
  private jobRepository: ReviewJobRepository;

  constructor() {
    this.resultRepository = new ReviewResultRepository();
    this.jobRepository = new ReviewJobRepository();
  }

  /**
   * 審査結果を取得する
   * @param resultId 審査結果ID
   * @returns 審査結果
   */
  async getReviewResult(resultId: string): Promise<ReviewResultDto | null> {
    return this.resultRepository.getReviewResult(resultId);
  }

  /**
   * 審査ジョブに関連する審査結果一覧を取得する
   * @param jobId 審査ジョブID
   * @param result 結果でフィルタリング（オプション）
   * @returns 審査結果一覧
   */
  async getReviewResultsByJobId(
    jobId: string,
    result?: string
  ): Promise<ReviewResultDto[]> {
    return this.resultRepository.getReviewResultsByJobId(jobId, result);
  }
  
  /**
   * 審査結果項目を取得する
   * @param jobId 審査ジョブID
   * @param parentId 親項目ID（指定がない場合はルート項目を取得）
   * @param filter フィルタリング条件（all, passed, failed）
   * @returns 審査結果項目の配列
   */
  async getReviewResultItems(
    jobId: string,
    parentId?: string,
    filter?: string
  ): Promise<ReviewResultItemDto[]> {
    console.log(`[Service] getReviewResultItems - jobId: ${jobId}, parentId: ${parentId || 'null'}, filter: ${filter || 'all'}`);
    
    // 審査ジョブの存在確認
    const job = await this.jobRepository.getReviewJob(jobId);
    console.log(`[Service] Job found:`, !!job);
    if (!job) {
      throw new Error(`Review job not found: ${jobId}`);
    }

    // 親項目が指定されている場合、その存在を確認
    if (parentId) {
      console.log(`[Service] Checking parent item: ${parentId}`);
      // checkIdで親項目を検索するように修正
      const parentResult = await this.resultRepository.getReviewResultByCheckId(jobId, parentId);
      console.log(`[Service] Parent result found:`, !!parentResult);
      if (!parentResult) {
        throw new Error(`Parent result not found: ${parentId}`);
      }
    }

    // 項目を取得
    const items = await this.resultRepository.getReviewResultItemsByParentId(jobId, parentId || null);
    console.log(`[Service] Found ${items.length} items before filtering`);

    // フィルタリング条件に基づいて項目をフィルタリング
    let filteredItems = items;
    if (filter) {
      if (filter === 'passed') {
        filteredItems = items.filter(item => item.status === 'completed' && item.result === 'pass');
      } else if (filter === 'failed') {
        filteredItems = items.filter(item => item.status === 'completed' && item.result === 'fail');
      }
      // 'all'の場合はフィルタリングしない
    }
    console.log(`[Service] Found ${filteredItems.length} items after filtering with ${filter || 'all'}`);

    // 子項目の有無を確認
    const checkIds = filteredItems.map(item => item.checkId);
    console.log(`[Service] Checking for children of ${checkIds.length} items`);
    const hasChildrenMap = await this.resultRepository.hasChildrenByCheckIds(jobId, checkIds);
    console.log(`[Service] hasChildrenMap size: ${hasChildrenMap.size}`);

    // 項目に子要素の有無情報を付与して返す
    const result = filteredItems.map(item => ({
      ...item,
      hasChildren: hasChildrenMap.get(item.checkId) || false
    }));
    
    console.log(`[Service] Returning ${result.length} items with hasChildren info`);
    return result;
  }
  
  /**
   * ユーザーによる審査結果の上書き
   * @param jobId 審査ジョブID
   * @param resultId 審査結果ID
   * @param params 上書きパラメータ
   * @returns 更新された審査結果
   */
  async overrideReviewResult(
    jobId: string,
    resultId: string,
    params: UpdateReviewResultParams
  ): Promise<ReviewResultDto> {
    // 審査結果の存在確認
    const result = await this.resultRepository.getReviewResult(resultId);
    if (!result) {
      throw new Error(`Review result not found: ${resultId}`);
    }

    // 審査結果が指定されたジョブに属しているか確認
    if (result.reviewJobId !== jobId) {
      throw new Error(
        `Review result ${resultId} does not belong to job ${jobId}`
      );
    }

    // 審査結果を上書き
    const updatedResult = await this.resultRepository.overrideReviewResult(
      resultId,
      params
    );

    return updatedResult;
  }

  /**
   * 親項目の結果を再計算する
   * @param jobId 審査ジョブID
   * @param checkId チェック項目ID
   */
  async recalculateParentResults(
    jobId: string,
    checkId: string
  ): Promise<void> {
    const prisma = getPrismaClient();

    // チェック項目の親を取得
    const checkItem = await prisma.checkList.findUnique({
      where: { id: checkId },
      select: { parentId: true },
    });

    if (!checkItem?.parentId) {
      // 親がない場合は何もしない
      return;
    }

    const parentId = checkItem.parentId;

    // 親項目の子項目の結果をすべて取得
    const childResults = await prisma.reviewResult.findMany({
      where: {
        reviewJobId: jobId,
        checkList: {
          parentId,
        },
      },
      include: {
        checkList: true,
      },
    });

    // 親項目の結果を取得
    const parentResult = await prisma.reviewResult.findFirst({
      where: {
        reviewJobId: jobId,
        checkId: parentId,
      },
    });

    if (!parentResult) {
      return;
    }

    // 子項目の結果に基づいて親項目の結果を計算
    // すべての子項目が完了している場合のみ親項目も完了とする
    const allCompleted = childResults.every((r) => r.status === "completed");

    if (allCompleted) {
      // すべての子項目がpassの場合のみ親項目もpass
      const allPassed = childResults.every((r) => r.result === "pass");
      const result = allPassed ? "pass" : "fail";

      // 親項目の結果を更新
      await this.resultRepository.updateReviewResult(parentResult.id, {
        status: "completed",
        result,
      });

      // さらに上位の親がある場合は再帰的に計算
      await this.recalculateParentResults(jobId, parentId);
    }
  }
}
