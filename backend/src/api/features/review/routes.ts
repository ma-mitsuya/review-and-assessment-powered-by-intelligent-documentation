/**
 * 審査機能のルート定義
 */
import { FastifyInstance } from "fastify";
import {
  getReviewPresignedUrlHandler,
  deleteReviewDocumentHandler,
} from "../handlers/review-document-handlers";
import {
  getReviewJobsHandler,
  createReviewJobHandler,
  deleteReviewJobHandler,
} from "../handlers/review-job-handlers";
import {
  getReviewResultItemsHandler,
  updateReviewResultHandler,
} from "../handlers/review-result-handlers";
import {
  getReviewPresignedUrlSchema,
  deleteReviewDocumentSchema,
} from "../schemas/review-document-schemas";
import {
  getReviewJobsSchema,
  createReviewJobSchema,
  deleteReviewJobSchema,
} from "../schemas/review-job-schemas";
import {
  getReviewResultItemsSchema,
  updateReviewResultSchema,
} from "../schemas/review-result-schemas";

/**
 * 審査機能のルート登録
 * @param fastify Fastifyインスタンス
 */
export function registerReviewRoutes(fastify: FastifyInstance): void {
  // 審査ドキュメント関連
  fastify.post(
    "/documents/review/presigned-url",
    { schema: getReviewPresignedUrlSchema },
    getReviewPresignedUrlHandler
  );
  fastify.delete(
    "/documents/review/:key",
    { schema: deleteReviewDocumentSchema },
    deleteReviewDocumentHandler
  );

  // 審査ジョブ関連
  fastify.get(
    "/review-jobs",
    { schema: getReviewJobsSchema },
    getReviewJobsHandler
  );
  fastify.post(
    "/review-jobs",
    { schema: createReviewJobSchema },
    createReviewJobHandler
  );
  fastify.delete(
    "/review-jobs/:id",
    { schema: deleteReviewJobSchema },
    deleteReviewJobHandler
  );

  // 審査結果関連
  fastify.get(
    "/review-jobs/:jobId/results/items",
    { schema: getReviewResultItemsSchema },
    getReviewResultItemsHandler
  );
  fastify.put(
    "/review-jobs/:jobId/results/:resultId",
    { schema: updateReviewResultSchema },
    updateReviewResultHandler
  );
}
