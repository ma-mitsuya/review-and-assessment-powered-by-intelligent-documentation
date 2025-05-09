# Review機能リファクタリング計画

## 1. ルート定義の統一

### 修正するファイル
- `/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/features/review/routes/review-routes.ts`
  - ルート定義のスタイルをchecklist方式に統一
  ```typescript
  // 変更前
  fastify.get(
    "/review-jobs",
    { schema: getReviewJobsSchema },
    getReviewJobsHandler
  );
  
  // 変更後
  fastify.get("/review-jobs", {
    schema: getReviewJobsSchema,
    handler: getReviewJobsHandler,
  });
  ```

## 2. サービスの最適化

### 修正するファイル
- `/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/features/review/services/review-job-service.ts`
  - 内部メソッドをprivateに変更
  - 新しいエラークラスを使用
  - スネークケースをキャメルケースに変更

- `/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/features/review/services/review-result-service.ts`
  - 内部メソッドをprivateに変更
  - 新しいエラークラスを使用
  - スネークケースをキャメルケースに変更

- `/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/features/review/services/review-document-service.ts`
  - 内部メソッドをprivateに変更
  - 新しいエラークラスを使用
  - スネークケースをキャメルケースに変更

## 3. ハンドラーの最適化

### 修正するファイル
- `/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/features/review/handlers/review-job-handlers.ts`
  - 新しいエラークラスを使用したエラーハンドリング
  - スネークケースをキャメルケースに変更

- `/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/features/review/handlers/review-result-handlers.ts`
  - 新しいエラークラスを使用したエラーハンドリング
  - スネークケースをキャメルケースに変更

- `/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/features/review/handlers/review-document-handlers.ts`
  - 新しいエラークラスを使用したエラーハンドリング
  - スネークケースをキャメルケースに変更

## 4. スキーマの最適化

### 修正するファイル
- `/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/features/review/schemas/review-job-schemas.ts`
- `/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/features/review/schemas/review-result-schemas.ts`
- `/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/features/review/schemas/review-document-schemas.ts`

## 実装手順

1. ルート定義のスタイル統一
2. サービスの最適化
3. ハンドラーの最適化
4. スキーマの最適化
