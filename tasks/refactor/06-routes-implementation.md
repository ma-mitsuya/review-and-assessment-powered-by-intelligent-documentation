# ルート定義ファイル実装計画

## Checklist機能のルート定義統合

### 新規作成するファイル: `/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/features/checklist/routes.ts`

```typescript
/**
 * チェックリスト機能のルート定義
 */
import { FastifyInstance } from "fastify";
import {
  createChecklistSetHandler,
  getChecklistSetsHandler,
  updateChecklistSetHandler,
  deleteChecklistSetHandler,
} from "./handlers/checklist-set-handlers";
import {
  createChecklistItemHandler,
  getChecklistItemsHandler,
  getChecklistItemHierarchyHandler,
  updateChecklistItemHandler,
  deleteChecklistItemHandler,
} from "./handlers/checklist-item-handlers";
import {
  createChecklistSetSchema,
  getChecklistSetsSchema,
  updateChecklistSetSchema,
  deleteChecklistSetSchema,
  createChecklistItemSchema,
  getChecklistItemsSchema,
  getChecklistItemHierarchySchema,
  updateChecklistItemSchema,
  deleteChecklistItemSchema,
} from "./schemas";

/**
 * チェックリスト関連のルートを登録
 * @param fastify Fastifyインスタンス
 */
export function registerChecklistRoutes(fastify: FastifyInstance): void {
  // チェックリストセット関連のルート
  fastify.get("/checklist-sets", {
    schema: getChecklistSetsSchema,
    handler: getChecklistSetsHandler,
  });

  fastify.post("/checklist-sets", {
    schema: createChecklistSetSchema,
    handler: createChecklistSetHandler,
  });

  fastify.put("/checklist-sets/:id", {
    schema: updateChecklistSetSchema,
    handler: updateChecklistSetHandler,
  });

  fastify.delete("/checklist-sets/:id", {
    schema: deleteChecklistSetSchema,
    handler: deleteChecklistSetHandler,
  });

  // チェックリスト項目関連のルート
  fastify.get("/checklist-sets/:setId/items", {
    schema: getChecklistItemsSchema,
    handler: getChecklistItemsHandler,
  });

  fastify.get("/checklist-sets/:setId/items/hierarchy", {
    schema: getChecklistItemHierarchySchema,
    handler: getChecklistItemHierarchyHandler,
  });

  fastify.post("/checklist-sets/:setId/items", {
    schema: createChecklistItemSchema,
    handler: createChecklistItemHandler,
  });

  fastify.put("/checklist-sets/:setId/items/:itemId", {
    schema: updateChecklistItemSchema,
    handler: updateChecklistItemHandler,
  });

  fastify.delete("/checklist-sets/:setId/items/:itemId", {
    schema: deleteChecklistItemSchema,
    handler: deleteChecklistItemHandler,
  });
}
```

### 修正するファイル: `/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/features/checklist/index.ts`

```typescript
/**
 * チェックリスト機能のエントリーポイント
 */
import { FastifyInstance } from 'fastify';
import { registerChecklistRoutes } from './routes';

/**
 * チェックリスト関連のすべてのルートを登録
 * @param fastify Fastifyインスタンス
 */
export function registerChecklistRoutes(fastify: FastifyInstance): void {
  // チェックリスト関連のルートを登録
  registerChecklistRoutes(fastify);
}
```

## Review機能のルート定義統一

### 修正するファイル: `/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/features/review/routes/review-routes.ts`

```typescript
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
  fastify.post("/documents/review/presigned-url", {
    schema: getReviewPresignedUrlSchema,
    handler: getReviewPresignedUrlHandler,
  });
  
  fastify.delete("/documents/review/:key", {
    schema: deleteReviewDocumentSchema,
    handler: deleteReviewDocumentHandler,
  });

  // 審査ジョブ関連
  fastify.get("/review-jobs", {
    schema: getReviewJobsSchema,
    handler: getReviewJobsHandler,
  });
  
  fastify.post("/review-jobs", {
    schema: createReviewJobSchema,
    handler: createReviewJobHandler,
  });
  
  fastify.delete("/review-jobs/:id", {
    schema: deleteReviewJobSchema,
    handler: deleteReviewJobHandler,
  });

  // 審査結果関連
  fastify.get("/review-jobs/:jobId/results/items", {
    schema: getReviewResultItemsSchema,
    handler: getReviewResultItemsHandler,
  });
  
  fastify.put("/review-jobs/:jobId/results/:resultId", {
    schema: updateReviewResultSchema,
    handler: updateReviewResultHandler,
  });
}
```

## 実装方針

1. チェックリスト機能のルート定義を統合
2. Review機能のルート定義スタイルを統一
3. index.tsファイルを更新して新しいルート定義を使用
4. 既存のルート定義ファイルを削除
