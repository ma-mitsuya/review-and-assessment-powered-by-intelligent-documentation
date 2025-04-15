# BEACON 審査機能バックエンド実装計画

## 概要

BEACON システムにおける審査機能のバックエンド実装計画を定義します。この機能は、アップロードされたドキュメントとチェックリストセットを突き合わせ、各チェック項目への適合性を LLM を用いて判定するものです。

## 実装ステップ

### フェーズ 1: データベースモデルの実装

#### 1.1 Prisma スキーマの更新

- `Document` モデルを `CheckListDocument` にリネーム
- 新規モデルの追加:
  - `ReviewDocument` (審査対象ドキュメント)
  - `ReviewJob` (審査ジョブ)
  - `ReviewResult` (審査結果)
- 既存モデルへの関連追加:
  - `CheckListSet` に `reviewJobs` 関連を追加
  - `CheckList` に `reviewResults` 関連を追加

```prisma
// チェックリスト作成元ドキュメント（既存のDocumentをリネーム）
model CheckListDocument {
  id             String        @id @map("document_id") @db.VarChar(26)
  filename       String        @db.VarChar(255)
  s3Path         String        @map("s3_path") @db.VarChar(512)
  fileType       String        @map("file_type") @db.VarChar(50)
  uploadDate     DateTime      @map("upload_date") @db.Timestamp()
  checkListSetId String        @map("check_list_set_id") @db.VarChar(26)
  userId         String?       @map("user_id") @db.VarChar(50)
  status         String        @default("pending") @db.VarChar(20)
  checkListSet   CheckListSet  @relation(fields: [checkListSetId], references: [id])
  checkResults   CheckResult[]
  checkLists     CheckList[]

  @@map("checklist_documents")
}

// 審査対象ドキュメント
model ReviewDocument {
  id             String      @id @map("review_document_id") @db.VarChar(26)
  filename       String      @db.VarChar(255)
  s3Path         String      @map("s3_path") @db.VarChar(512)
  fileType       String      @map("file_type") @db.VarChar(50)
  uploadDate     DateTime    @map("upload_date") @db.Timestamp()
  userId         String?     @map("user_id") @db.VarChar(50)
  status         String      @default("pending") @db.VarChar(20)
  reviewJobs     ReviewJob[]

  @@map("review_documents")
}

// 審査ジョブ
model ReviewJob {
  id              String          @id @map("review_job_id") @db.VarChar(26)
  name            String          @db.VarChar(255)
  status          String          @default("pending") @db.VarChar(20) // pending, processing, completed, failed
  documentId      String          @map("document_id") @db.VarChar(26)
  checkListSetId  String          @map("check_list_set_id") @db.VarChar(26)
  createdAt       DateTime        @map("created_at") @db.Timestamp()
  updatedAt       DateTime        @map("updated_at") @db.Timestamp()
  completedAt     DateTime?       @map("completed_at") @db.Timestamp()
  userId          String?         @map("user_id") @db.VarChar(50)
  metaData        Json?           @map("meta_data") @db.Json
  document        ReviewDocument  @relation(fields: [documentId], references: [id])
  checkListSet    CheckListSet    @relation(fields: [checkListSetId], references: [id])
  reviewResults   ReviewResult[]

  @@map("review_jobs")
}

// 審査結果
model ReviewResult {
  id              String      @id @map("review_result_id") @db.VarChar(26)
  reviewJobId     String      @map("review_job_id") @db.VarChar(26)
  checkId         String      @map("check_id") @db.VarChar(26)
  status          String      @default("pending") @db.VarChar(20) // pending, processing, completed, failed
  result          String?     @db.VarChar(20) // pass, fail
  confidenceScore Float?      @map("confidence_score")
  explanation     String?     @db.Text
  extractedText   String?     @map("extracted_text") @db.Text
  userOverride    Boolean     @default(false) @map("user_override")
  userComment     String?     @map("user_comment") @db.Text
  createdAt       DateTime    @map("created_at") @db.Timestamp()
  updatedAt       DateTime    @map("updated_at") @db.Timestamp()
  metaData        Json?       @map("meta_data") @db.Json
  reviewJob       ReviewJob   @relation(fields: [reviewJobId], references: [id])
  checkList       CheckList   @relation(fields: [checkId], references: [id])

  @@map("review_results")
}
```

#### 1.2 マイグレーションの実行

- Prisma マイグレーションファイルの作成
- マイグレーションの実行とテスト

#### 1.3 既存コードの更新

- `Document` から `CheckListDocument` への参照を更新
- 関連するリポジトリ、サービス、コントローラーの更新

### フェーズ 2: 審査ドキュメント管理機能の実装

#### 2.1 ドメインモデルの実装

- `ReviewDocument` エンティティの実装
- `ReviewDocumentRepository` インターフェースの定義
- `PrismaReviewDocumentRepository` の実装

#### 2.2 ユースケースの実装

- `UploadReviewDocumentUseCase` の実装
- `GetReviewDocumentUseCase` の実装
- `ListReviewDocumentsUseCase` の実装

#### 2.3 API エンドポイントの実装

- `/review-documents/presigned-url` エンドポイントの実装
- `/review-documents` エンドポイントの実装

### フェーズ 3: 審査ジョブ管理機能の実装

#### 3.1 ドメインモデルの実装

- `ReviewJob` エンティティの実装
- `ReviewJobRepository` インターフェースの定義
- `PrismaReviewJobRepository` の実装

#### 3.2 ユースケースの実装

- `CreateReviewJobUseCase` の実装
- `ListReviewJobsUseCase` の実装
- `DeleteReviewJobUseCase` の実装

#### 3.3 API エンドポイントの実装

- `POST /review-jobs` エンドポイントの実装
- `GET /review-jobs` エンドポイントの実装
- `DELETE /review-jobs/:id` エンドポイントの実装

### フェーズ 4: 審査結果管理機能の実装

#### 4.1 ドメインモデルの実装

- `ReviewResult` エンティティの実装
- `ReviewResultRepository` インターフェースの定義
- `PrismaReviewResultRepository` の実装

#### 4.2 ユースケースの実装

- `GetReviewResultHierarchyUseCase` の実装
- `UpdateReviewResultUseCase` の実装

#### 4.3 API エンドポイントの実装

- `GET /review-jobs/:jobId/results/hierarchy` エンドポイントの実装
- `PUT /review-jobs/:jobId/results/:resultId` エンドポイントの実装

### フェーズ 5: 審査処理機能の実装

#### 5.1 LLM 連携機能の実装

- `ReviewProcessor` インターフェースの定義
- `LlmReviewProcessor` の実装
- プロンプトテンプレートの作成

#### 5.2 非同期処理の実装

- AWS Step Functions の定義 (TBD)
- 処理状態の監視機能の実装
- エラーハンドリングの実装

#### 5.3 審査結果の計算ロジックの実装

- 階層構造を考慮した結果計算ロジックの実装
- 信頼度スコアの計算と閾値の設定

## ディレクトリ構成

```
backend/src/api/features/review/
├── domain/
│   ├── entities/
│   │   ├── review-document.ts
│   │   ├── review-job.ts
│   │   └── review-result.ts
│   └── repositories/
│       ├── review-document-repository.ts
│       ├── review-job-repository.ts
│       └── review-result-repository.ts
├── application/
│   ├── use-cases/
│   │   ├── create-review-job.ts
│   │   ├── list-review-jobs.ts
│   │   ├── delete-review-job.ts
│   │   ├── get-review-result-hierarchy.ts
│   │   └── update-review-result.ts
│   └── services/
│       └── review-processor.ts
├── infrastructure/
│   ├── repositories/
│   │   ├── prisma-review-document-repository.ts
│   │   ├── prisma-review-job-repository.ts
│   │   └── prisma-review-result-repository.ts
│   └── services/
│       └── llm-review-processor.ts
├── interfaces/
│   ├── controllers/
│   │   ├── review-document-controller.ts
│   │   ├── review-job-controller.ts
│   │   └── review-result-controller.ts
│   └── routes/
│       ├── review-document-routes.ts
│       ├── review-job-routes.ts
│       └── review-result-routes.ts
└── constants/
    └── review-constants.ts
```

## テスト計画

### 1. 単体テスト

- リポジトリの実装テスト
- ユースケースの実装テスト
- コントローラーの実装テスト

### 2. 統合テスト

- API エンドポイントの統合テスト
- リポジトリの統合テスト（実際のデータベースを使用）

### 3. E2E テスト

- 審査ジョブの作成から結果取得までの一連のフローのテスト
- エラーケースのテスト

## リスクと対策

### 1. データベースマイグレーションのリスク

- **リスク**: 既存の `Document` モデルのリネームにより、既存のデータや関連が失われる可能性がある
- **対策**: マイグレーション前にデータのバックアップを取得し、テスト環境で十分に検証する

### 2. LLM 連携のリスク

- **リスク**: LLM の応答が予期しない形式になる可能性がある
- **対策**: 堅牢なエラーハンドリングとリトライ機構を実装する

### 3. 非同期処理のリスク

- **リスク**: 長時間実行されるジョブがタイムアウトする可能性がある
- **対策**: 適切なタイムアウト設定とエラー通知機構を実装する

## 実装スケジュール

### フェーズ 1: データベースモデルの実装
- 所要時間: 2日間

### フェーズ 2: 審査ドキュメント管理機能の実装
- 所要時間: 3日間

### フェーズ 3: 審査ジョブ管理機能の実装
- 所要時間: 3日間

### フェーズ 4: 審査結果管理機能の実装
- 所要時間: 4日間

### フェーズ 5: 審査処理機能の実装
- 所要時間: 5日間

### テストとバグ修正
- 所要時間: 3日間

**合計所要時間**: 20日間

## 次のステップ

1. Prisma スキーマの更新と既存コードの修正
2. 審査ドキュメント管理機能の実装
3. 審査ジョブ管理機能の実装
4. 審査結果管理機能の実装
5. LLM 連携と非同期処理の実装
