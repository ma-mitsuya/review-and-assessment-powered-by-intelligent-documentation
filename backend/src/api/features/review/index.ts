/**
 * 審査機能のエントリーポイント
 */
import { FastifyInstance } from 'fastify';
import { registerReviewRoutes as registerReviewRoutesInternal } from './routes/review-routes';

/**
 * 審査関連のすべてのルートを登録
 * @param fastify Fastifyインスタンス
 */
export function registerReviewRoutes(fastify: FastifyInstance): void {
  // 審査関連のルートを登録
  registerReviewRoutesInternal(fastify);
  
  // 将来的に他の審査関連ルートを追加する場合はここに記述
}
