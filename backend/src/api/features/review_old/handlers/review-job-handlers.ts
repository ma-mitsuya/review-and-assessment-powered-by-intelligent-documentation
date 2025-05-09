/**
 * 審査ジョブ関連のハンドラー
 */
import { FastifyReply, FastifyRequest } from "fastify";
import { ReviewJobService } from "../services/review-job-service";
import { CreateReviewJobParams, GetReviewJobsParams } from "../types";

/**
 * 審査ジョブ一覧取得ハンドラー
 */
export async function getReviewJobsHandler(
  request: FastifyRequest<{ Querystring: GetReviewJobsParams }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { page = 1, limit = 10, sortBy, sortOrder, status } = request.query;

    const reviewJobService = new ReviewJobService();
    const result = await reviewJobService.getReviewJobs({
      page,
      limit,
      sortBy,
      sortOrder,
      status,
    });

    // レスポンス形式に変換
    const reviewJobs = result.reviewJobs.map((job) => ({
      review_job_id: job.id,
      name: job.name,
      status: job.status,
      document: job.document
        ? {
            document_id: job.document.id,
            filename: job.document.filename,
          }
        : undefined,
      check_list_set: job.checkListSet
        ? {
            check_list_set_id: job.checkListSet.id,
            name: job.checkListSet.name,
          }
        : undefined,
      created_at: job.createdAt,
      updated_at: job.updatedAt,
      completed_at: job.completedAt,
      summary: job.summary,
    }));

    reply.code(200).send({
      success: true,
      data: {
        reviewJobs,
        total: result.total,
      },
    });
  } catch (error) {
    request.log.error(error);
    reply.code(500).send({
      success: false,
      error: "審査ジョブ一覧の取得に失敗しました",
    });
  }
}

/**
 * 審査ジョブ作成ハンドラー
 */
export async function createReviewJobHandler(
  request: FastifyRequest<{ Body: CreateReviewJobParams }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { name, documentId, checkListSetId, fileType, filename, s3Key } =
      request.body;

    // ユーザーIDの取得（認証情報から）
    // 注: 認証機能が実装されていない場合はnullになります
    const userId = undefined; // 認証機能が実装されたら request.user?.id などに変更

    const reviewJobService = new ReviewJobService();
    const job = await reviewJobService.createReviewJob({
      name,
      documentId,
      checkListSetId,
      fileType,
      filename,
      s3Key,
      userId,
    });

    // レスポンス形式に変換
    const responseData = {
      review_job_id: job.id,
      name: job.name,
      status: job.status,
      document: job.document
        ? {
            document_id: job.document.id,
            filename: job.document.filename,
          }
        : undefined,
      check_list_set: job.checkListSet
        ? {
            check_list_set_id: job.checkListSet.id,
            name: job.checkListSet.name,
          }
        : undefined,
      created_at: job.createdAt,
      updated_at: job.updatedAt,
      completed_at: job.completedAt,
    };

    reply.code(201).send({
      success: true,
      data: responseData,
    });
  } catch (error) {
    request.log.error(error);

    if (error instanceof Error && error.message.includes("not found")) {
      reply.code(400).send({
        success: false,
        error: error.message,
      });
      return;
    }

    reply.code(500).send({
      success: false,
      error: "審査ジョブの作成に失敗しました",
    });
  }
}

/**
 * 審査ジョブ削除ハンドラー
 */
export async function deleteReviewJobHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { id } = request.params;

    const reviewJobService = new ReviewJobService();

    try {
      await reviewJobService.deleteReviewJob(id);

      reply.code(200).send({
        success: true,
        data: {
          deleted: true,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        reply.code(404).send({
          success: false,
          error: `審査ジョブが見つかりません: ${id}`,
        });
        return;
      }
      throw error;
    }
  } catch (error) {
    request.log.error(error);
    reply.code(500).send({
      success: false,
      error: "審査ジョブの削除に失敗しました",
    });
  }
}
