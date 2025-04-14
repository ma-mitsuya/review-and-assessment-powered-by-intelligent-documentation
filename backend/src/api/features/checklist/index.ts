/**
 * チェックリスト機能のエントリーポイント
 */
import { FastifyInstance } from 'fastify';
import { registerChecklistSetRoutes } from './routes/checklist-set-routes';

/**
 * チェックリスト関連のすべてのルートを登録
 * @param fastify Fastifyインスタンス
 */
export function registerChecklistRoutes(fastify: FastifyInstance): void {
  // チェックリストセット関連のルートを登録
  registerChecklistSetRoutes(fastify);
  
  // 将来的に他のチェックリスト関連ルートを追加する場合はここに記述
  // 例: registerChecklistItemRoutes(fastify);
}
