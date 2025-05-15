import { FastifyInstance } from "fastify";
import {
  createReviewJobHandler,
  deleteReviewDocumentHandler,
  deleteReviewJobHandler,
  getAllReviewJobsHandler,
  getReviewPresignedUrlHandler,
} from "./handlers";

/**
 * 審査機能のルート登録
 * @param fastify Fastifyインスタンス
 */
export function registerReviewRoutes(fastify: FastifyInstance): void {
  // 審査ドキュメント関連
  fastify.post("/documents/review/presigned-url", {
    handler: getReviewPresignedUrlHandler,
  });
  fastify.delete("/documents/review/:key", {
    handler: deleteReviewDocumentHandler,
  });

  // 審査ジョブ関連
  fastify.get("/review-jobs", {
    handler: getAllReviewJobsHandler,
  });
  fastify.post("/review-jobs", {
    handler: createReviewJobHandler,
  });
  fastify.delete("/review-jobs/:id", {
    handler: deleteReviewJobHandler,
  });

  // 審査結果関連
  // fastify.get("/review-jobs/:jobId/results/items", {
  //   handler: getReviewResultItemsHandler,
  // });
  // fastify.put("/review-jobs/:jobId/results/:resultId", {
  //   handler: updateReviewResultHandler,
  // });
}
