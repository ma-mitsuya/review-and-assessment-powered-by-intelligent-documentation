/**
 * 審査ジョブリポジトリ
 */
import { PrismaClient } from "@prisma/client";
import { getPrismaClient } from "../../../core/db";
import {
  CreateReviewJobParams,
  GetReviewJobsParams,
  ReviewJobDto,
} from "../types";
import { generateId } from "../../../core/utils/id-generator";

/**
 * 審査ジョブリポジトリ
 */
export class ReviewJobRepository {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = getPrismaClient()) {
    this.prisma = prismaClient;
  }

  /**
   * 審査ジョブを作成する
   * @param params 審査ジョブ作成パラメータ
   * @returns 作成された審査ジョブ
   */
  async createReviewJob(
    params: CreateReviewJobParams & { id: string }
  ): Promise<ReviewJobDto> {
    const now = new Date();

    const filename: string = params.filename;
    const s3Path: string = params.s3Key;
    const fileType: string = params.fileType;

    return this.prisma.$transaction(async (tx) => {
      // 審査ドキュメントを作成
      await tx.reviewDocument.create({
        data: {
          id: params.documentId,
          filename: filename,
          s3Path: s3Path,
          fileType: fileType,
          uploadDate: now,
          status: "processing",
        },
      });

      // 審査ジョブを作成
      const job = await tx.reviewJob.create({
        data: {
          id: params.id,
          name: params.name,
          status: "pending",
          documentId: params.documentId,
          checkListSetId: params.checkListSetId,
          createdAt: now,
          updatedAt: now,
          userId: params.userId,
        },
        include: {
          document: true,
          checkListSet: true,
        },
      });

      // チェックリスト項目を取得して審査結果を作成
      const checkListSet = await tx.checkListSet.findUnique({
        where: { id: params.checkListSetId },
        include: { checkLists: true },
      });

      if (checkListSet) {
        for (const checkList of checkListSet.checkLists) {
          await tx.reviewResult.create({
            data: {
              id: generateId(),
              reviewJobId: params.id,
              checkId: checkList.id,
              status: "pending",
              userOverride: false,
              createdAt: now,
              updatedAt: now,
            },
          });
        }
      }

      return job;
    });
  }

  /**
   * 審査ジョブを取得する
   * @param jobId 審査ジョブID
   * @returns 審査ジョブ
   */
  async getReviewJob(jobId: string): Promise<ReviewJobDto | null> {
    return this.prisma.reviewJob.findUnique({
      where: { id: jobId },
      include: {
        document: true,
        checkListSet: true,
      },
    });
  }

  /**
   * 審査ジョブ一覧を取得する
   * @param params 取得パラメータ
   * @returns 審査ジョブ一覧
   */
  async getReviewJobs(params: {
    skip: number;
    take: number;
    orderBy: Record<string, string>;
    status?: string;
  }): Promise<ReviewJobDto[]> {
    const { skip, take, orderBy, status } = params;

    const where = status ? { status } : {};

    return this.prisma.reviewJob.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        document: true,
        checkListSet: true,
      },
    });
  }

  /**
   * 審査ジョブの総数を取得する
   * @param status ステータスでフィルタリング（オプション）
   * @returns 審査ジョブの総数
   */
  async getReviewJobsCount(status?: string): Promise<number> {
    const where = status ? { status } : {};
    return this.prisma.reviewJob.count({ where });
  }

  /**
   * 審査ジョブのステータスを更新する
   * @param jobId 審査ジョブID
   * @param status 新しいステータス
   * @returns 更新された審査ジョブ
   */
  async updateReviewJobStatus(
    jobId: string,
    status: string
  ): Promise<ReviewJobDto> {
    const now = new Date();
    const data: any = {
      status,
      updatedAt: now,
    };

    // 完了時は完了日時も設定
    if (status === "completed") {
      data.completedAt = now;
    }

    return this.prisma.reviewJob.update({
      where: { id: jobId },
      data,
      include: {
        document: true,
        checkListSet: true,
      },
    });
  }

  /**
   * 審査ジョブを削除する
   * @param jobId 審査ジョブID
   * @returns 削除が成功したかどうか
   */
  async deleteReviewJob(jobId: string): Promise<boolean> {
    await this.prisma.$transaction(async (tx) => {
      // 関連する審査結果を削除
      await tx.reviewResult.deleteMany({
        where: { reviewJobId: jobId },
      });

      // 審査ジョブを削除
      await tx.reviewJob.delete({
        where: { id: jobId },
      });
    });

    return true;
  }
}
