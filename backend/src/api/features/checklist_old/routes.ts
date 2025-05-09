/**
 * チェックリスト項目関連のルート定義
 */
import { FastifyInstance } from "fastify";
import {
  getChecklistItemHandler,
  getChecklistItemHierarchyHandler,
  createChecklistItemHandler,
  updateChecklistItemHandler,
  deleteChecklistItemHandler,
} from "./handlers/checklist-item-handlers";
import {
  getChecklistItemSchema,
  getChecklistItemHierarchySchema,
  createChecklistItemSchema,
  updateChecklistItemSchema,
  deleteChecklistItemSchema,
} from "./schemas/checklist-item-schemas";
import {
  createChecklistSetHandler,
  getChecklistSetsHandler,
  deleteChecklistSetHandler,
} from "./handlers/checklist-set-handlers";
import {
  createChecklistSetSchema,
  getChecklistSetsSchema,
  deleteChecklistSetSchema,
} from "./schemas/checklist-set-schemas";
import {
  getChecklistPresignedUrlHandler,
  deleteChecklistDocumentHandler,
} from "./handlers/checklist-document-handlers";

/**
 * チェックリスト関連のルートを登録
 * @param fastify Fastifyインスタンス
 */
export function registerChecklistRoutes(fastify: FastifyInstance): void {
  // チェックリスト項目詳細取得エンドポイント
  fastify.get("/checklist-sets/:setId/items/:itemId", {
    schema: getChecklistItemSchema,
    handler: getChecklistItemHandler,
  });

  // チェックリスト項目作成エンドポイント
  fastify.post("/checklist-sets/:setId/items", {
    schema: createChecklistItemSchema,
    handler: createChecklistItemHandler,
  });

  // チェックリスト項目更新エンドポイント
  fastify.put("/checklist-sets/:setId/items/:itemId", {
    schema: updateChecklistItemSchema,
    handler: updateChecklistItemHandler,
  });

  // チェックリスト項目削除エンドポイント
  fastify.delete("/checklist-sets/:setId/items/:itemId", {
    schema: deleteChecklistItemSchema,
    handler: deleteChecklistItemHandler,
  });

  // チェックリスト項目階層構造取得エンドポイント
  fastify.get("/checklist-sets/:setId/items/hierarchy", {
    schema: getChecklistItemHierarchySchema,
    handler: getChecklistItemHierarchyHandler,
  });
  // チェックリストセット一覧取得エンドポイント
  fastify.get("/checklist-sets", {
    schema: getChecklistSetsSchema,
    handler: getChecklistSetsHandler,
  });

  // チェックリストセット作成エンドポイント
  fastify.post("/checklist-sets", {
    schema: createChecklistSetSchema,
    handler: createChecklistSetHandler,
  });

  // チェックリストセット削除エンドポイント
  fastify.delete("/checklist-sets/:id", {
    schema: deleteChecklistSetSchema,
    handler: deleteChecklistSetHandler,
  });

  // チェックリストドキュメント関連のルート
  fastify.post(
    "/documents/checklist/presigned-url",
    getChecklistPresignedUrlHandler
  );
  fastify.delete(
    "/documents/checklist/:key",
    deleteChecklistDocumentHandler
  );
}
