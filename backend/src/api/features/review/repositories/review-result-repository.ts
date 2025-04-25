/**
 * 審査結果リポジトリ
 */
import { PrismaClient } from "../../../../../prisma/client";
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
    return this.prisma.reviewResult.findUnique({
      where: { id: resultId },
      include: {
        checkList: true,
      },
    });
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
