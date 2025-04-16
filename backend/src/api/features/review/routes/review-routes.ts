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
  getReviewResultHierarchyHandler,
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
  getReviewResultHierarchySchema,
  updateReviewResultSchema,
} from "../schemas/review-result-schemas";

/**
 * 審査機能のルート登録
 * @param fastify Fastifyインスタンス
 */
export function registerReviewRoutes(fastify: FastifyInstance): void {
  // 審査ドキュメント関連
  fastify.post(
    "/api/documents/review/presigned-url",
    { schema: getReviewPresignedUrlSchema },
    getReviewPresignedUrlHandler
  );
  fastify.delete(
    "/api/documents/review/:key",
    { schema: deleteReviewDocumentSchema },
    deleteReviewDocumentHandler
  );

  // 審査ジョブ関連
  fastify.get(
    "/api/review-jobs",
    { schema: getReviewJobsSchema },
    getReviewJobsHandler
  );
  fastify.post(
    "/api/review-jobs",
    { schema: createReviewJobSchema },
    createReviewJobHandler
  );
  fastify.delete(
    "/api/review-jobs/:id",
    { schema: deleteReviewJobSchema },
    deleteReviewJobHandler
  );

  // 審査結果関連
  fastify.get(
    "/api/review-jobs/:jobId/results/hierarchy",
    { schema: getReviewResultHierarchySchema },
    getReviewResultHierarchyHandler
  );
  fastify.put(
    "/api/review-jobs/:jobId/results/:resultId",
    { schema: updateReviewResultSchema },
    updateReviewResultHandler
  );
}
