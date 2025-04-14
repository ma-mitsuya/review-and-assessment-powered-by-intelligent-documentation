/**
 * チェックリストセット関連のルート定義
 */
import { FastifyInstance } from 'fastify';
import { createChecklistSetHandler } from '../handlers/checklist-set-handlers';
import { createChecklistSetSchema } from '../schemas/checklist-set-schemas';

/**
 * チェックリストセット関連のルートを登録
 * @param fastify Fastifyインスタンス
 */
export function registerChecklistSetRoutes(fastify: FastifyInstance): void {
  // チェックリストセット作成エンドポイント
  fastify.post('/checklist-sets', {
    schema: createChecklistSetSchema,
    handler: createChecklistSetHandler
  });
}
