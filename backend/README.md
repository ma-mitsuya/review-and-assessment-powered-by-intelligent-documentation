# BEACON バックエンド

BEACON（Building & Engineering Approval Compliance Navigator）のバックエンド実装です。

## ディレクトリ構造

```
/backend
├── src
│   ├── index.ts                      # Lambda ハンドラーのエントリーポイント
│   ├── core                          # コア機能（共通で使用される基盤機能）
│   │   ├── llm                       # LLM関連の機能
│   │   │   ├── llm-config.ts         # LLM設定
│   │   │   ├── llm-core.ts           # LLMコア機能
│   │   │   ├── llm-types.ts          # LLM型定義
│   │   │   ├── llm-client.ts         # LLMクライアント
│   │   │   ├── document              # ドキュメント処理
│   │   │   ├── operations            # LLM操作
│   │   │   └── __tests__             # LLMテスト
│   │   └── utils                     # 共通ユーティリティ
│   │       ├── result.ts             # Result型
│   │       ├── s3.ts                 # S3操作
│   │       ├── retry.ts              # リトライロジック
│   │       └── __tests__             # ユーティリティテスト
│   └── features                      # 機能モジュール
│       ├── document-processing       # ドキュメント処理機能
│       │   ├── types.ts              # 型定義
│       │   ├── process-document.ts   # ドキュメント処理
│       │   ├── split-pages.ts        # ページ分割
│       │   ├── extract-text.ts       # テキスト抽出
│       │   └── __tests__             # テスト
│       ├── page-processing           # ページ処理機能
│       │   ├── types.ts              # 型定義
│       │   ├── process-page.ts       # ページ処理
│       │   ├── llm-processing.ts     # LLM処理
│       │   └── __tests__             # テスト
│       ├── batch-processing          # バッチ処理機能
│       │   ├── types.ts              # 型定義
│       │   ├── prepare-batch.ts      # バッチ準備
│       │   ├── create-batch-job.ts   # バッチジョブ作成
│       │   ├── process-results.ts    # 結果処理
│       │   └── __tests__             # テスト
│       └── result-combining          # 結果統合機能
│           ├── types.ts              # 型定義
│           ├── combine-results.ts    # 結果統合
│           └── __tests__             # テスト
├── integration-tests                 # 統合テスト
│   ├── document-workflow.test.ts     # ドキュメントワークフロー
│   └── fixtures                      # テスト用ファイル
├── package.json
└── tsconfig.json
```

## 開発環境のセットアップ

### 前提条件

- Node.js 18以上
- AWS CLI（設定済み）
- AWS Bedrockへのアクセス権限

### インストール

```bash
# 依存関係のインストール
npm install
```

### 環境変数の設定

`.env` ファイルをバックエンドディレクトリに作成し、以下の変数を設定します：

```
AWS_REGION=us-west-2
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
S3_BUCKET_NAME=beacon-documents
BATCH_ROLE_ARN=arn:aws:iam::123456789012:role/BedrockBatchRole
```

## テスト

```bash
# ユニットテストの実行
npm run test:unit

# 統合テストの実行（実際のAWS APIを呼び出します）
npm run test:integration

# すべてのテストを実行
npm test
```

## 開発

```bash
# 開発サーバーの起動
npm run dev

# ビルド
npm run build

# 本番環境での実行
npm start
```

## 主要な機能

### ドキュメント処理

ドキュメントをアップロードし、ページに分割して処理します。

```typescript
import { processDocument } from './features/document-processing';

const result = await processDocument(documentId, fileBuffer, fileName);
```

### ページ処理

各ページをマルチモーダルLLMで処理します。

```typescript
import { processPage } from './features/page-processing';

const result = await processPage({
  documentId,
  pageNumber,
  imageKey
});
```

### 結果統合

処理結果を統合します。

```typescript
import { combineResults } from './features/result-combining';

const result = await combineResults({
  documentId,
  pageResults
});
```

### バッチ処理

大量のドキュメントをバッチ処理します。

```typescript
import { createBatchJob } from './features/batch-processing';

const result = await createBatchJob({
  documentId,
  pages
});
```
