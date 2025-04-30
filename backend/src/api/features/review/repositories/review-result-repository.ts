/**
 * 審査結果リポジトリ
 */
import { PrismaClient } from "../../../core/db";
import { getPrismaClient } from "../../../core/db";
import { ReviewResultDto, UpdateReviewResultParams } from "../types";

/**
 * 審査結果リポジトリ
 */
export class ReviewResultRepository {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = getPrismaClient()) {
    this.prisma = prismaClient;
  }

  /**
   * 審査結果を作成する
   * @param params 審査結果作成パラメータ
   * @returns 作成された審査結果
   */
  async createReviewResult(params: {
    id: string;
    reviewJobId: string;
    checkId: string;
  }): Promise<ReviewResultDto> {
    const now = new Date();
    return this.prisma.reviewResult.create({
      data: {
        id: params.id,
        reviewJobId: params.reviewJobId,
        checkId: params.checkId,
        status: "pending",
        userOverride: false,
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  /**
   * 審査結果を取得する
   * @param resultId 審査結果ID
   * @returns 審査結果
   */
  async getReviewResult(resultId: string): Promise<ReviewResultDto | null> {
    console.log(`[Repository] getReviewResult - resultId: ${resultId}`);
    const result = await this.prisma.reviewResult.findUnique({
      where: { id: resultId },
      include: {
        checkList: true,
      },
    });
    console.log(`[Repository] Result found:`, !!result);
    if (result) {
      console.log(`[Repository] Result checkId: ${result.checkId}, reviewJobId: ${result.reviewJobId}`);
    }
    return result;
  }

  /**
   * checkIdに基づいて審査結果を取得する
   * @param jobId 審査ジョブID
   * @param checkId チェック項目ID
   * @returns 審査結果
   */
  async getReviewResultByCheckId(jobId: string, checkId: string): Promise<ReviewResultDto | null> {
    console.log(`[Repository] getReviewResultByCheckId - jobId: ${jobId}, checkId: ${checkId}`);
    const result = await this.prisma.reviewResult.findFirst({
      where: { 
        reviewJobId: jobId,
        checkId: checkId
      },
      include: {
        checkList: true,
      },
    });
    console.log(`[Repository] Result found by checkId:`, !!result);
    if (result) {
      console.log(`[Repository] Result id: ${result.id}, checkId: ${result.checkId}, reviewJobId: ${result.reviewJobId}`);
    }
    return result;
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
    const where: any = { reviewJobId: jobId };
    if (result) {
      where.result = result;
    }

    return this.prisma.reviewResult.findMany({
      where,
      include: {
        checkList: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  }

  /**
   * 親IDに基づいて審査結果項目を取得する
   * @param jobId 審査ジョブID
   * @param parentId 親項目ID（nullの場合はルート項目を取得）
   * @returns 審査結果項目の配列
   */
  async getReviewResultItemsByParentId(
    jobId: string,
    parentId: string | null
  ): Promise<ReviewResultDto[]> {
    console.log(`[Repository] getReviewResultItemsByParentId - jobId: ${jobId}, parentId: ${parentId || 'null'}`);
    
    // クエリの構築を詳細にログ出力
    const query = {
      where: {
        reviewJobId: jobId,
        checkList: {
          parentId: parentId
        }
      },
      include: {
        checkList: true,
      },
      orderBy: {
        createdAt: "asc" as const,
      },
    };
    console.log(`[Repository] Query:`, JSON.stringify(query));
    
    const results = await this.prisma.reviewResult.findMany(query);
    
    console.log(`[Repository] Found ${results.length} items`);
    if (results.length > 0) {
      console.log(`[Repository] First item checkId: ${results[0].checkId}`);
      if (results[0].checkList) {
        console.log(`[Repository] First item checkList.parentId: ${results[0].checkList.parentId}`);
      } else {
        console.log(`[Repository] First item checkList is null`);
      }
    }
    
    return results;
  }

  /**
   * 特定の親項目を持つ審査結果の存在を確認する
   * @param jobId 審査ジョブID
   * @param checkIds チェック項目IDの配列
   * @returns チェック項目IDごとの子要素の有無
   */
  async hasChildrenByCheckIds(
    jobId: string,
    checkIds: string[]
  ): Promise<Map<string, boolean>> {
    console.log(`[Repository] hasChildrenByCheckIds - jobId: ${jobId}, checkIds: ${checkIds.join(', ')}`);
    
    if (checkIds.length === 0) {
      return new Map();
    }
    
    // 各チェック項目IDに対して子要素の有無を確認
    const hasChildrenMap = new Map<string, boolean>();
    
    // 各チェック項目IDごとに子要素の存在を確認
    for (const checkId of checkIds) {
      console.log(`[Repository] Checking children for checkId: ${checkId}`);
      
      const query = {
        where: {
          reviewJobId: jobId,
          checkList: {
            parentId: checkId
          }
        }
      };
      console.log(`[Repository] Count query:`, JSON.stringify(query));
      
      const count = await this.prisma.reviewResult.count(query);
      console.log(`[Repository] Child count for ${checkId}: ${count}`);
      
      hasChildrenMap.set(checkId, count > 0);
    }

    return hasChildrenMap;
  }

  /**
   * 審査結果を更新する
   * @param resultId 審査結果ID
   * @param params 更新パラメータ
   * @returns 更新された審査結果
   */
  async updateReviewResult(
    resultId: string,
    params: {
      status?: string;
      result?: string;
      confidenceScore?: number;
      explanation?: string;
      extractedText?: string;
    }
  ): Promise<ReviewResultDto> {
    return this.prisma.reviewResult.update({
      where: { id: resultId },
      data: {
        ...params,
        updatedAt: new Date(),
      },
      include: {
        checkList: true,
      },
    });
  }

  /**
   * ユーザーによる審査結果の上書き
   * @param resultId 審査結果ID
   * @param params 上書きパラメータ
   * @returns 更新された審査結果
   */
  async overrideReviewResult(
    resultId: string,
    params: UpdateReviewResultParams
  ): Promise<ReviewResultDto> {
    return this.prisma.reviewResult.update({
      where: { id: resultId },
      data: {
        result: params.result,
        userComment: params.userComment,
        userOverride: true,
        updatedAt: new Date(),
      },
      include: {
        checkList: true,
      },
    });
  }

  /**
   * 審査ジョブに関連する審査結果の集計を取得する
   * @param jobId 審査ジョブID
   * @returns 集計結果
   */
  async getReviewResultsSummary(jobId: string): Promise<{
    total: number;
    passed: number;
    failed: number;
    processing: number;
  }> {
    const results = await this.prisma.reviewResult.findMany({
      where: { reviewJobId: jobId },
      select: {
        status: true,
        result: true,
      },
    });

    const total = results.length;
    const passed = results.filter((r) => r.result === "pass").length;
    const failed = results.filter((r) => r.result === "fail").length;
    const processing = results.filter((r) => r.status !== "completed").length;

    return {
      total,
      passed,
      failed,
      processing,
    };
  }
}
