import { prisma } from "../../../core/prisma";
import { PrismaClient } from "../../../core/db";
import { ReviewJobModel, ReviewJobMetaModel } from "./model/review";

export interface ReviewRepository {
  findAllReviewJobs(): Promise<ReviewJobMetaModel[]>;
  createReviewJob(params: ReviewJobModel): Promise<void>;
  deleteReviewJobById(params: { reviewJobId: string }): Promise<void>;
}

export const makePrismaReviewRepository = (
  client: PrismaClient = prisma
): ReviewRepository => {
  const findAllReviewJobs = async (): Promise<ReviewJobMetaModel[]> => {
    const jobs = await client.reviewJob.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        document: {
          select: {
            id: true,
            filename: true,
            s3Path: true,
            fileType: true,
          },
        },
        checkListSet: {
          select: {
            id: true,
            name: true,
          },
        },
        // サマリー情報計算用にレビュー結果も同時取得
        reviewResults: {
          select: {
            status: true,
            result: true,
          },
        },
      },
    });

    // 各ジョブのモデルを構築
    return jobs.map((job) => {
      // サマリー情報を計算
      const reviewResults = job.reviewResults || [];
      const summary = {
        total: reviewResults.length,
        passed: reviewResults.filter((r) => r.result === "pass").length,
        failed: reviewResults.filter((r) => r.result === "fail").length,
        processing: reviewResults.filter((r) => r.status !== "completed")
          .length,
      };

      return {
        id: job.id,
        name: job.name,
        status: job.status,
        documentId: job.documentId,
        checkListSetId: job.checkListSetId,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        completedAt: job.completedAt,
        userId: job.userId,
        document: {
          id: job.document.id,
          filename: job.document.filename,
          s3Path: job.document.s3Path,
          fileType: job.document.fileType,
        },
        checkListSet: {
          id: job.checkListSet.id,
          name: job.checkListSet.name,
        },
        summary,
      };
    });
  };

  const createReviewJob = async (params: ReviewJobModel): Promise<void> => {
    const now = new Date();

    client.$transaction(async (tx) => {
      // 審査ドキュメントを作成
      await tx.reviewDocument.create({
        data: {
          id: params.documentId,
          filename: params.filename,
          s3Path: params.s3Key,
          fileType: params.fileType,
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

      // 審査結果の作成はStep Functions側のprepareReview関数で行うため、ここでは行わない

      return job;
    });
  };

  const deleteReviewJobById = async (params: {
    reviewJobId: string;
  }): Promise<void> => {
    const { reviewJobId } = params;
    await client.$transaction(async (tx) => {
      await tx.reviewResult.deleteMany({ where: { reviewJobId } });
      await tx.reviewJob.delete({ where: { id: reviewJobId } });
    });
  };

  return {
    findAllReviewJobs,
    createReviewJob,
    deleteReviewJobById,
  };
};
