/**
 * チェックリストセット関連のルート定義
 */
import { FastifyInstance } from 'fastify';
import { 
  createChecklistSetHandler, 
  getChecklistSetsHandler,
  deleteChecklistSetHandler
} from '../handlers/checklist-set-handlers';
import { 
  createChecklistSetSchema, 
  getChecklistSetsSchema,
  deleteChecklistSetSchema
} from '../schemas/checklist-set-schemas';

/**
 * チェックリストセット関連のルートを登録
 * @param fastify Fastifyインスタンス
 */
export function registerChecklistSetRoutes(fastify: FastifyInstance): void {
  // チェックリストセット一覧取得エンドポイント
  fastify.get('/api/checklist-sets', {
    schema: getChecklistSetsSchema,
    handler: getChecklistSetsHandler
  });

  // チェックリストセット作成エンドポイント
  fastify.post('/api/checklist-sets', {
    schema: createChecklistSetSchema,
    handler: createChecklistSetHandler
  });

  // チェックリストセット削除エンドポイント
  fastify.delete('/api/checklist-sets/:id', {
    schema: deleteChecklistSetSchema,
    handler: deleteChecklistSetHandler
  });
}
