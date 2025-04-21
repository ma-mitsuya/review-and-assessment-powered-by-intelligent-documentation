# BEACON CDK 実装計画（最終版）

## 概要

本計画は、BEACON (Building & Engineering Approval Compliance Navigator) プロジェクトに以下の機能を追加するための実装計画です：

1. 既存の Fastify Web アプリケーションにヘルスチェック用ルートの追加
2. API Gateway + Lambda による REST API の実装（Lambda Web Adapter を使用）
3. Aurora MySQL Serverless v2 データベースの実装

## 1. ヘルスチェック用ルートの追加

### 現状分析

既存のコードを調査した結果、ヘルスチェック用のルートは既に `/health` として `backend/src/api/core/app.ts` に実装されていることが確認できました：

```typescript
// ヘルスチェックエンドポイント
app.get('/health', async (_, reply) => {
  reply.code(200).send({ status: 'ok' });
});
```

**結論**: このエンドポイントは既に存在するため、新たに追加する必要はありません。

## 2. REST API の実装 (API Gateway + Lambda with Lambda Web Adapter)

### ファイル作成計画

以下の新規ファイルを作成します：

1. **`cdk/lib/constructs/api.ts`**
   - 目的: API Gateway と Lambda を使用して既存の Fastify アプリケーションを呼び出す構成を実装
   - 理由: 既存のコードベースには API Gateway と Lambda の統合が実装されていないため
   - API Key 認証を追加し、セキュリティを強化

### 既存コード調査結果

- `backend/src/api/index.ts` が既存の Fastify アプリケーションのエントリーポイントとして存在
- `cdk/lib/constructs/` ディレクトリには `document-page-processor.ts` と `review-processor.ts` のみ存在し、API Gateway 関連の Construct は存在しません

### 実装詳細

#### `cdk/lib/constructs/api.ts`

- API Gateway (REST API) と Lambda 関数を定義
- API Key 認証を設定
  - API Key を作成し、使用量プランを設定
  - API Key の値を取得するための CLI コマンドを CfnOutput に出力
- Lambda Web Adapter を使用して既存の Fastify アプリケーションを呼び出す設定
  - Lambda 関数のコンテナイメージを使用
- 必要な IAM 権限を設定
- 他のリソースへのアクセス権限を付与するための grant メソッドを実装

#### 既存の `backend/src/api/index.ts` の活用

- 新規ファイルは作成せず、既存の Fastify アプリケーションをそのまま使用
- Lambda Web Adapter が HTTP リクエストを Lambda のイベントに変換し、Lambda の応答を HTTP レスポンスに変換するため、特別な修正は不要

## 3. Aurora MySQL Serverless v2 データベースの実装

### ファイル作成計画

以下の新規ファイルを作成します：

1. **`cdk/lib/constructs/database.ts`**
   - 目的: Aurora MySQL Serverless v2 データベースを実装
   - 理由: 既存のコードベースにはデータベース関連の Construct が実装されていないため

### 既存コード調査結果

- `cdk/lib/constructs/` ディレクトリには `document-page-processor.ts` と `review-processor.ts` のみ存在し、データベース関連の Construct は存在しません
- `backend/prisma/schema.prisma` にはデータベーススキーマが定義されていますが、CDK でのデータベースリソース定義は存在しません

### 実装詳細

#### `cdk/lib/constructs/database.ts`

- Aurora MySQL Serverless v2 クラスターを定義
- 最小スペックの設定（最小容量単位、自動スケーリング設定など）
- マネジメントコンソールからのアクセスを可能にする設定
- 汎用的なアクセス権限付与のための grant メソッドを実装
  - `IPeer` インターフェースを活用し、様々なリソース（Lambda、Step Functions など）に対応
  - TCP 接続とシークレットアクセスの権限を付与
  - 以下のようなメソッドを提供:
    ```typescript
    // 任意のIPeerにデータベース接続権限を付与
    public grantConnect(peer: ec2.IPeer): void
    
    // 任意のIGrantableにデータベースシークレットへのアクセス権限を付与
    public grantSecretAccess(grantable: iam.IGrantable): void
    ```

## 4. BeaconStack の更新

### ファイル修正計画

以下の既存ファイルを修正します：

1. **`cdk/lib/beacon-stack.ts`**
   - 修正内容: 新しい API と Database Construct を統合
   - 理由: 新しく作成した Construct をスタックに追加するため

### 修正詳細

- 新しい API と Database Construct のインポート
- Construct のインスタンス化
- 適切な権限設定
  - API Lambda 関数にデータベース接続権限を付与:
    ```typescript
    // TCP接続とシークレットアクセス権限を付与
    database.grantConnect(api.apiLambda);
    database.grantSecretAccess(api.apiLambda);
    ```
  - ドキュメント処理 Lambda にデータベース接続権限を付与:
    ```typescript
    // TCP接続とシークレットアクセス権限を付与
    database.grantConnect(documentProcessor.documentLambda);
    database.grantSecretAccess(documentProcessor.documentLambda);
    ```
  - 審査処理 Lambda にデータベース接続権限を付与:
    ```typescript
    // TCP接続とシークレットアクセス権限を付与
    database.grantConnect(reviewProcessor.reviewLambda);
    database.grantSecretAccess(reviewProcessor.reviewLambda);
    ```
  - S3 バケットアクセス権限の付与:
    ```typescript
    documentBucket.grantReadWrite(api.apiLambda);
    ```
- 出力の追加
  - API Key の値を取得するための CLI コマンドを CfnOutput に出力

## 5. Dockerfile の作成

### ファイル作成計画

以下の新規ファイルを作成します：

1. **`backend/Dockerfile`**
   - 目的: Lambda 関数用のコンテナイメージを定義
   - 理由: Lambda Web Adapter を使用するために必要

### 実装詳細

```dockerfile
FROM node:22-slim

# Lambda Web Adapter を追加
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.9.0 /lambda-adapter /opt/extensions/lambda-adapter

WORKDIR /var/task
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN npm run build

# 環境変数の設定
ENV PORT=8080
ENV NODE_ENV=production
ENV AWS_LWA_READINESS_CHECK_PATH=/health
ENV AWS_LWA_ASYNC_INIT=true
ENV AWS_LWA_ENABLE_COMPRESSION=true

# アプリケーションの起動
CMD ["node", "dist/api/index.js"]
```

## 環境変数の詳細

Lambda Web Adapter で使用する主要な環境変数とその設定値について詳細に説明します：

1. **`PORT`** / **`AWS_LWA_PORT`**:
   - 説明: Lambda Web Adapter がトラフィックを転送するポート番号（Web アプリケーションが待ち受けるポート）
   - 設定値: `8080`（Fastify アプリケーションのデフォルトポートに合わせる）
   - 理由: 既存の Fastify アプリケーションは環境変数 `PORT` を使用してポートを設定しているため

2. **`AWS_LWA_READINESS_CHECK_PATH`**:
   - 説明: アプリケーションの起動確認に使用するパス
   - 設定値: `/health`
   - 理由: 既存のヘルスチェックエンドポイントを活用するため

3. **`AWS_LWA_ASYNC_INIT`**:
   - 説明: 長い初期化時間を持つ関数のための非同期初期化を有効にするかどうか
   - 設定値: `true`
   - 理由: Prisma クライアントの初期化など、データベース接続の初期化に時間がかかる可能性があるため

4. **`AWS_LWA_ENABLE_COMPRESSION`**:
   - 説明: レスポンスボディの gzip 圧縮を有効にするかどうか
   - 設定値: `true`
   - 理由: ネットワーク帯域の使用量を削減し、パフォーマンスを向上させるため

これらの環境変数は `Dockerfile` 内で直接設定し、Lambda 関数の実行環境に提供されます。

## API Key 認証の詳細

API Gateway に API Key 認証を追加する詳細は以下の通りです：

1. **API Key の作成**:
   - API Gateway に API Key を作成し、使用量プランを設定
   - API Key の有効期限を設定（例: 90日）

2. **使用量プランの設定**:
   - スロットリング制限を設定（例: 1秒あたり 10 リクエスト）
   - クォータを設定（例: 1日あたり 10,000 リクエスト）

3. **API Key の取得方法**:
   - API Key の値を取得するための CLI コマンドを CfnOutput に出力
   - 出力例: `aws apigateway get-api-key --api-key [key-id] --include-value --region [region]`

4. **API Key の要求設定**:
   - API Gateway の全メソッドに API Key を要求するように設定
   - または、特定のメソッドのみに API Key を要求するように設定

## 実装順序

1. レビュー: 本計画書のレビューと承認
2. `database.ts` Construct の実装とレビュー
3. `api.ts` Construct の実装とレビュー（API Key 認証を含む）
4. `backend/Dockerfile` の作成とレビュー
5. `beacon-stack.ts` の更新とレビュー
6. デプロイとテスト

## リスクと対策

### リスク 1: Lambda Web Adapter の設定問題

**対策**:
- Lambda Web Adapter のドキュメントを詳細に確認
- 環境変数の適切な設定
- ローカルでのテスト環境の構築

### リスク 2: データベース接続の問題

**対策**: 
- VPC エンドポイントの適切な設定
- セキュリティグループの適切な設定
- 接続テスト用のスクリプトを用意

### リスク 3: API Key 認証の問題

**対策**:
- API Key の適切な設定と管理
- API Key の更新メカニズムの検討
- クライアント側での API Key の安全な取り扱いの指導

## テスト計画

1. データベース接続テスト
   - Lambda からの接続テスト
   - マネジメントコンソールからの接続テスト

2. API エンドポイントテスト
   - ヘルスチェックエンドポイントのテスト
   - API Key 認証のテスト
   - 各機能エンドポイントのテスト

3. 統合テスト
   - エンドツーエンドのワークフローテスト
   - エラーハンドリングのテスト
