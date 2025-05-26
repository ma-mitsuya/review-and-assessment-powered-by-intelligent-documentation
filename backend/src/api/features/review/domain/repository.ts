import { getPrismaClient, PrismaClient } from "../../../core/db";
import { NotFoundError } from "../../../core/errors";
import {
  ReviewJobEntity,
  ReviewJobSummary,
  ReviewJobDetail,
  REVIEW_JOB_STATUS,
  ReviewResultEntity,
  ReviewResultDetail,
  REVIEW_RESULT,
  REVIEW_RESULT_STATUS,
  REVIEW_FILE_TYPE,
  ReviewJobStats,
} from "./model/review";
import { CheckListStatus } from "../../checklist/domain/model/checklist";

export interface ReviewJobRepository {
  findAllReviewJobs(): Promise<ReviewJobSummary[]>;
  findReviewJobById(params: { reviewJobId: string }): Promise<ReviewJobDetail>;
  createReviewJob(params: ReviewJobEntity): Promise<void>;
  deleteReviewJobById(params: { reviewJobId: string }): Promise<void>;
  updateJobStatus(params: {
    reviewJobId: string;
    status: REVIEW_JOB_STATUS;
  }): Promise<void>;
}

export const makePrismaReviewJobRepository = async (
  clientInput: PrismaClient | null = null
): Promise<ReviewJobRepository> => {
  const client = clientInput || (await getPrismaClient());

  const findAllReviewJobs = async (): Promise<ReviewJobSummary[]> => {
    const jobs = await client.reviewJob.findMany({
      orderBy: { id: "desc" },
      include: {
        documents: {
          select: {
            id: true,
            filename: true,
            s3Path: true,
            fileType: true,
          },
          orderBy: {
            id: "asc",
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
      const stats = {
        total: reviewResults.length,
        passed: reviewResults.filter((r) => r.result === "pass").length,
        failed: reviewResults.filter((r) => r.result === "fail").length,
        processing: reviewResults.filter((r) => r.status !== "completed")
          .length,
      };

      return {
        id: job.id,
        name: job.name,
        status: job.status as REVIEW_JOB_STATUS,
        checkListSetId: job.checkListSetId,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        completedAt: job.completedAt || undefined,
        userId: job.userId || undefined,
        documents: job.documents.map((doc) => ({
          id: doc.id,
          filename: doc.filename,
          s3Path: doc.s3Path,
          fileType: doc.fileType as REVIEW_FILE_TYPE,
        })),
        checkListSet: {
          id: job.checkListSet.id,
          name: job.checkListSet.name,
        },
        stats,
      };
    });
  };

  const findReviewJobById = async (params: {
    reviewJobId: string;
  }): Promise<ReviewJobDetail> => {
    const { reviewJobId } = params;

    const job = await client.reviewJob.findUnique({
      where: { id: reviewJobId },
      include: {
        documents: {
          orderBy: {
            id: "asc",
          },
        },
        checkListSet: {
          include: {
            documents: true,
          },
        },
      },
    });

    if (!job) {
      throw new NotFoundError(`Review job not found`, reviewJobId);
    }

    return {
      id: job.id,
      name: job.name,
      status: job.status as REVIEW_JOB_STATUS,
      checkList: {
        id: job.checkListSet.id,
        name: job.checkListSet.name,
        description: job.checkListSet.description || "",
        documents: job.checkListSet.documents.map((doc) => ({
          id: doc.id,
          filename: doc.filename,
          s3Key: doc.s3Path,
          fileType: doc.fileType,
          uploadDate: doc.uploadDate,
          status: doc.status as CheckListStatus,
        })),
      },
      documents: job.documents.map((doc) => ({
        id: doc.id,
        filename: doc.filename,
        s3Path: doc.s3Path,
        fileType: doc.fileType as REVIEW_FILE_TYPE,
      })),
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      completedAt: job.completedAt || undefined,
    };
  };

  const createReviewJob = async (params: ReviewJobEntity): Promise<void> => {
    const now = new Date();

    await client.$transaction(async (tx) => {
      // 審査ジョブを作成
      await tx.reviewJob.create({
        data: {
          id: params.id,
          name: params.name,
          status: params.status,
          checkListSetId: params.checkListSetId,
          createdAt: now,
          updatedAt: now,
          userId: params.userId,
        },
        include: {
          documents: true,
          checkListSet: true,
        },
      });

      // 審査ドキュメントを作成
      for (const doc of params.documents) {
        await tx.reviewDocument.create({
          data: {
            id: doc.id,
            filename: doc.filename,
            s3Path: doc.s3Key,
            fileType: doc.fileType,
            uploadDate: now,
            status: "processing",
            reviewJobId: params.id,
          },
        });
      }

      // 審査結果を作成
      for (const result of params.results) {
        await tx.reviewResult.create({
          data: {
            id: result.id,
            reviewJobId: params.id,
            checkId: result.checkId,
            status: result.status,
            userOverride: result.userOverride,
            createdAt: now,
            updatedAt: now,
          },
        });
      }
    });
  };

  const deleteReviewJobById = async (params: {
    reviewJobId: string;
  }): Promise<void> => {
    const { reviewJobId } = params;

    await client.$transaction(async (tx) => {
      // 関連する審査結果を削除
      await tx.reviewResult.deleteMany({ where: { reviewJobId } });

      // 関連する審査ドキュメントを削除
      await tx.reviewDocument.deleteMany({ where: { reviewJobId } });

      // 審査ジョブを削除
      await tx.reviewJob.delete({ where: { id: reviewJobId } });
    });
  };

  const updateJobStatus = async (params: {
    reviewJobId: string;
    status: REVIEW_JOB_STATUS;
  }): Promise<void> => {
    const { reviewJobId, status } = params;
    await client.reviewJob.update({
      where: { id: reviewJobId },
      data: {
        status,
        updatedAt: new Date(),
      },
    });
  };

  return {
    findAllReviewJobs,
    findReviewJobById,
    createReviewJob,
    deleteReviewJobById,
    updateJobStatus,
  };
};

export interface ReviewResultRepository {
  findDetailedReviewResultById(params: {
    resultId: string;
  }): Promise<ReviewResultDetail>;
  findReviewResultsById(params: {
    jobId: string;
    parentId?: string;
    filter?: REVIEW_RESULT;
    includeAllChildren?: boolean;
  }): Promise<ReviewResultDetail[]>;
  updateResult(params: { newResult: ReviewResultEntity }): Promise<void>;
  bulkUpdateResults(params: { results: ReviewResultEntity[] }): Promise<void>;
}

export const makePrismaReviewResultRepository = async (
  clientInput: PrismaClient | null = null
): Promise<ReviewResultRepository> => {
  const client = clientInput || (await getPrismaClient());
  const findDetailedReviewResultById = async (params: {
    resultId: string;
  }): Promise<ReviewResultDetail> => {
    const { resultId } = params;

    // 1) 対象の ReviewResult と紐づく CheckList を取得
    const result = await client.reviewResult.findUnique({
      where: { id: resultId },
      include: { checkList: true },
    });

    if (!result) {
      throw new Error(`ReviewResult not found: ${resultId}`);
    }

    // 2) 同じジョブ内で、このチェック項目に対する子結果があるかをカウント
    const childCount = await client.reviewResult.count({
      where: {
        reviewJobId: result.reviewJobId,
        checkList: {
          parentId: result.checkId,
        },
      },
    });

    // 3) ドメインモデルにマッピングして返却
    return {
      id: result.id,
      reviewJobId: result.reviewJobId,
      checkId: result.checkId,
      status: result.status as REVIEW_RESULT_STATUS,
      result: result.result as REVIEW_RESULT | undefined,
      confidenceScore: result.confidenceScore ?? undefined,
      explanation: result.explanation ?? undefined,
      extractedText: result.extractedText ?? undefined,
      userOverride: result.userOverride,
      userComment: (result as any).userComment ?? undefined,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      sourceDocumentId: result.sourceDocumentId ?? undefined,
      sourcePageNumber: result.sourcePageNumber ?? undefined,
      checkList: {
        id: result.checkList.id,
        setId: result.checkList.checkListSetId,
        name: result.checkList.name,
        description: result.checkList.description ?? undefined,
        parentId: result.checkList.parentId ?? undefined,
      },
      hasChildren: childCount > 0,
    };
  };

  const findReviewResultsById = async (params: {
    jobId: string;
    parentId?: string;
    filter?: REVIEW_RESULT;
    includeAllChildren: boolean;
  }): Promise<ReviewResultDetail[]> => {
    const { jobId, parentId, filter, includeAllChildren } = params;

    console.log(
      `[Repository] findReviewResultsById - jobId: ${jobId}, parentId: ${
        parentId || "null"
      }, filter: ${filter || "all"}, includeAllChildren: ${includeAllChildren}`
    );

    // クエリの基本条件を構築
    const whereCondition: any = {
      reviewJobId: jobId,
    };

    // includeAllChildrenがfalseの場合のみ、parentIdの条件を適用
    if (!includeAllChildren) {
      whereCondition.checkList = {
        parentId: parentId || null,
      };
    }

    // フィルター条件を追加
    if (filter) {
      whereCondition.status = REVIEW_RESULT_STATUS.COMPLETED;
      whereCondition.result = filter;
    }

    // 審査結果を取得
    const results = await client.reviewResult.findMany({
      where: whereCondition,
      include: {
        checkList: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    console.log(`[Repository] Found ${results.length} results`);

    // 結果のcheckIdとparentIdをログ出力
    console.log(
      `[Repository] Result checkIds and parentIds:`,
      results.map((r) => ({
        checkId: r.checkId,
        parentId: r.checkList.parentId,
      }))
    );

    if (results.length === 0) {
      return [];
    }

    // 子要素の有無を一括確認
    const checkIds = results.map((result) => result.checkId);

    console.log(`[Repository] Checking for children of checkIds:`, checkIds);

    // すべてのチェックIDに対する子の存在を一度に確認する
    // まず、jobIdに関連するすべての結果を取得し、checkListのparentIdがcheckIdsに含まれるものを選択
    const childResults = await client.reviewResult.findMany({
      where: {
        reviewJobId: jobId,
        checkList: {
          parentId: {
            in: checkIds,
          },
        },
      },
      select: {
        checkList: {
          select: {
            parentId: true,
          },
        },
      },
    });

    console.log(`[Repository] Found ${childResults.length} child results`);

    // 子を持つ親IDのセットを作成
    const parentsWithChildren = new Set(
      childResults.map((child) => child.checkList.parentId)
    );

    // 結果を新しいモデル形式に変換して返す
    const mappedResults = results.map((result) => ({
      id: result.id,
      reviewJobId: result.reviewJobId,
      checkId: result.checkId,
      status: result.status as REVIEW_RESULT_STATUS,
      result: result.result as REVIEW_RESULT | undefined,
      confidenceScore: result.confidenceScore || undefined,
      explanation: result.explanation || undefined,
      extractedText: result.extractedText || undefined,
      userComment: result.userComment || undefined,
      userOverride: result.userOverride,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      // 新規追加フィールド
      sourceDocumentId: (result as any).sourceDocumentId || undefined,
      sourcePageNumber: (result as any).sourcePageNumber || undefined,
      checkList: {
        id: result.checkList.id,
        setId: result.checkList.checkListSetId,
        name: result.checkList.name,
        description: result.checkList.description || undefined,
        parentId: result.checkList.parentId || undefined,
      },
      hasChildren: parentsWithChildren.has(result.checkId),
    }));

    return mappedResults;
  };

  const updateResult = async (params: {
    newResult: ReviewResultEntity;
  }): Promise<void> => {
    const { newResult } = params;
    await client.reviewResult.update({
      where: { id: newResult.id },
      data: {
        status: newResult.status,
        result: newResult.result,
        confidenceScore: newResult.confidenceScore,
        explanation: newResult.explanation,
        extractedText: newResult.extractedText,
        userOverride: newResult.userOverride,
        userComment: newResult.userComment,
        updatedAt: newResult.updatedAt,
        sourceDocumentId: newResult.sourceDocumentId,
        sourcePageNumber: newResult.sourcePageNumber,
      },
    });
  };

  const bulkUpdateResults = async (params: {
    results: ReviewResultEntity[];
  }): Promise<void> => {
    const { results } = params;

    await client.$transaction(async (tx) => {
      for (const result of results) {
        await tx.reviewResult.update({
          where: { id: result.id },
          data: {
            status: result.status,
            result: result.result,
            confidenceScore: result.confidenceScore,
            explanation: result.explanation,
            extractedText: result.extractedText,
            userOverride: result.userOverride,
            userComment: result.userComment,
            updatedAt: result.updatedAt,
          },
        });
      }
    });
  };

  return {
    findDetailedReviewResultById,
    findReviewResultsById,
    updateResult,
    bulkUpdateResults,
  };
};
