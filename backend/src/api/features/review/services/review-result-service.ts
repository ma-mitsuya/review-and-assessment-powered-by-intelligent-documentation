/**
 * 審査結果サービス
 */
import { ReviewResultRepository } from "../repositories/review-result-repository";
import { ReviewJobRepository } from "../repositories/review-job-repository";
import {
  ReviewResultDto,
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
   * 審査結果の階層構造を取得する
   * @param jobId 審査ジョブID
   * @returns 階層構造の審査結果
   */
  async getReviewResultHierarchy(
    jobId: string
  ): Promise<ReviewResultHierarchyDto[]> {
    // 審査ジョブの存在確認
    const job = await this.jobRepository.getReviewJob(jobId);
    if (!job) {
      throw new Error(`Review job not found: ${jobId}`);
    }

    // 審査ジョブに関連する全ての審査結果を取得
    const results = await this.resultRepository.getReviewResultsByJobId(jobId);

    // parentIdごとに子要素をグループ化（O(n)の計算量）
    const childrenByParent = new Map<string | null, ReviewResultDto[]>();
    results.forEach((result) => {
      const parentId = result.checkList?.parentId ?? null;
      if (!childrenByParent.has(parentId)) {
        childrenByParent.set(parentId, []);
      }
      childrenByParent.get(parentId)!.push(result);
    });

    // 階層構造を構築する関数（O(n)の計算量）
    const buildHierarchy = (result: ReviewResultDto): ReviewResultHierarchyDto => {
      const children = childrenByParent.get(result.checkId) || [];
      return {
        ...result,
        children: children.map(buildHierarchy)
      };
    };

    // 最上位項目（parentId = null）から階層構造を構築
    const rootResults = childrenByParent.get(null) || [];
    return rootResults.map(buildHierarchy);
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
