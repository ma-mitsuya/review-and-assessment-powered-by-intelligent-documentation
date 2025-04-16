/**
 * チェックリスト機能のエントリーポイント
 */
import { FastifyInstance } from 'fastify';
import { registerChecklistSetRoutes } from './routes/checklist-set-routes';
import { registerChecklistItemRoutes } from './routes/checklist-item-routes';

/**
 * チェックリスト関連のすべてのルートを登録
 * @param fastify Fastifyインスタンス
 */
export function registerChecklistRoutes(fastify: FastifyInstance): void {
  // チェックリストセット関連のルートを登録
  registerChecklistSetRoutes(fastify);
  
  // チェックリスト項目関連のルートを登録
  registerChecklistItemRoutes(fastify);
}
