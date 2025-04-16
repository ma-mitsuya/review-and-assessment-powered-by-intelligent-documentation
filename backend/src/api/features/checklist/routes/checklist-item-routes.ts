/**
 * チェックリスト項目関連のルート定義
 */
import { FastifyInstance } from 'fastify';
import { 
  getChecklistItemHandler,
  getChecklistItemHierarchyHandler,
  createChecklistItemHandler,
  updateChecklistItemHandler,
  deleteChecklistItemHandler
} from '../handlers/checklist-item-handlers';
import { 
  getChecklistItemSchema,
  getChecklistItemHierarchySchema,
  createChecklistItemSchema,
  updateChecklistItemSchema,
  deleteChecklistItemSchema
} from '../schemas/checklist-item-schemas';

/**
 * チェックリスト項目関連のルートを登録
 * @param fastify Fastifyインスタンス
 */
export function registerChecklistItemRoutes(fastify: FastifyInstance): void {
  // チェックリスト項目詳細取得エンドポイント
  fastify.get('/api/checklist-sets/:setId/items/:itemId', {
    schema: getChecklistItemSchema,
    handler: getChecklistItemHandler
  });

  // チェックリスト項目作成エンドポイント
  fastify.post('/api/checklist-sets/:setId/items', {
    schema: createChecklistItemSchema,
    handler: createChecklistItemHandler
  });

  // チェックリスト項目更新エンドポイント
  fastify.put('/api/checklist-sets/:setId/items/:itemId', {
    schema: updateChecklistItemSchema,
    handler: updateChecklistItemHandler
  });

  // チェックリスト項目削除エンドポイント
  fastify.delete('/api/checklist-sets/:setId/items/:itemId', {
    schema: deleteChecklistItemSchema,
    handler: deleteChecklistItemHandler
  });
  
  // チェックリスト項目階層構造取得エンドポイント
  fastify.get('/api/checklist-sets/:setId/items/hierarchy', {
    schema: getChecklistItemHierarchySchema,
    handler: getChecklistItemHierarchyHandler
  });
}
