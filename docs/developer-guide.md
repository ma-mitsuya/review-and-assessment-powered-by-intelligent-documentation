# RAPID 開発者ガイド

このガイドは RAPID（Review & Assessment Powered by Intelligent Documentation）の開発者向け情報をまとめたものです。

## 目次

- [アーキテクチャ](#アーキテクチャ)
- [技術スタック](#技術スタック)
- [ローカル開発環境](#ローカル開発環境)
- [コード規約](#コード規約)
- [テスト](#テスト)
- [デプロイ](#デプロイ)
- [パラメータカスタマイズ](#パラメータカスタマイズ)

## アーキテクチャ

RAPID は堅牢かつスケーラブルなクラウドネイティブアーキテクチャを採用しています。

アーキテクチャの概要:

1. **フロントエンド**:

   - Amazon S3 でホストされた React アプリケーション
   - Amazon CloudFront による配信
   - AWS WAF によるセキュリティ保護

2. **認証/認可**:

   - Amazon Cognito による認証管理

3. **API レイヤー**:

   - Amazon API Gateway
   - AWS Lambda による Fastify REST API

4. **処理レイヤー**:

   - AWS Step Functions による文書処理ワークフロー
   - AWS Lambda 関数によるドキュメント分析
   - Amazon Bedrock による AI/ML 処理

5. **データレイヤー**:
   - Amazon RDS/Aurora (MySQL) によるデータベース
   - Amazon S3 によるドキュメントストレージ

## 技術スタック

### バックエンド

- **言語**: TypeScript (ES Modules)
- **フレームワーク**: Fastify (REST API)
- **データベース**: MySQL
- **ORM**: Prisma
- **テスト**: Vitest

### フロントエンド

- **言語**: TypeScript
- **フレームワーク**: React with Vite
- **スタイリング**: Tailwind CSS
- **状態管理**: SWR
- **アイコン**: react-icons

### インフラストラクチャ

- **IaC**: AWS CDK (TypeScript)
- **コンピュート**: AWS Lambda
- **ワークフロー**: AWS Step Functions
- **AI/ML**: Amazon Bedrock

## ローカル開発環境

### 前提条件

- Node.js (v18 以上)
- Docker と Docker Compose
- AWS CLI (設定済み)

### 環境構築

1. **ローカルデータベースの起動**

   ```bash
   # ルートディレクトリで実行
   docker-compose -f assets/local/docker-compose.yml up -d
   ```

2. **バックエンドの準備**

   ```bash
   cd backend
   npm ci

   # 環境変数の設定
   cp .env.example .env
   # 必要に応じて .env を編集

   # Prisma クライアントの生成
   npm run prisma:generate

   # 開発サーバー起動
   npm run dev
   ```

3. **フロントエンドの準備**

   ```bash
   cd frontend
   npm ci

   # 環境変数の設定
   cp .env.example .env
   # 必要に応じて .env を編集

   # 開発サーバー起動
   npm run dev
   ```

### 便利なコマンド

```bash
# バックエンド開発
cd backend
npm run dev          # 開発サーバー起動
npm run test         # テストの実行
npm run build        # ビルド
npm run prisma:studio  # データベース GUI

# フロントエンド開発
cd frontend
npm run dev          # 開発サーバー起動
npm run build        # ビルド
```

## コード規約

### 共通規約

- **言語**: TypeScript のみ使用可能 (JavaScript/Python 禁止)
- **モジュールシステム**: ES Modules のみ (CommonJS 禁止)

### バックエンド

- **アーキテクチャ**: レイヤードアーキテクチャ (routes → usecase → domain)
- **リポジトリパターン**: データベースアクセスはリポジトリを介して実行

バックエンドの詳細なコード規約については [.clinerules/backend.md](./.clinerules/backend.md) を参照してください。

### フロントエンド

- **コンポーネント**: 共通コンポーネントの再利用
- **Tailwind**: 設定ファイル修正禁止
- **機能ベース**: 機能ごとにフォルダを分けて実装

フロントエンドの詳細なコード規約については [.clinerules/frontend.md](./.clinerules/frontend.md) を参照してください。

## テスト

- **テストフレームワーク**: Vitest (jest は禁止)
- **リポジトリテスト**: 実際の DB に接続してテスト
- **単体テスト**: モックを使用

```bash
# バックエンドテスト実行
cd backend
npm run test -- test-suite

# 全テスト実行
npm test

# ビルドが成功することを確認
npm run build

# 成功後フォーマットを適用
npm run format
```

## デプロイ

詳細なデプロイ手順は [デプロイガイド](./how_to_deploy.md) を参照してください。

### 簡易デプロイ手順

```bash
# MySQLのDockerコンテナを起動
docker-compose -f assets/local/docker-compose.yml up -d

# バックエンドの準備
cd backend
npm ci
npm run prisma:generate  # Prismaクライアントの生成
npm run build

# CDKのデプロイ
cd ../cdk
npm ci
npm run build
cdk bootstrap  # 初回のみ
cdk deploy --all --require-approval never

# ローカルMySQLの停止
cd ..
docker-compose -f assets/local/docker-compose.yml down -v
```

### デプロイ後の初期設定

デプロイ完了後、以下の手順が必要です:

1. AWS Management Console で、Lambda サービスに移動
2. `BeaconStack-PrismaMigrationMigrationFunction~` という名前の Lambda 関数を検索して選択
3. 「テスト」タブを選択
4. 以下の JSON をテストイベントとして設定し実行
   ```json
   { "command": "deploy" }
   ```

## パラメータカスタマイズ

### CDK デプロイ時のパラメータカスタマイズ

CDK デプロイ時に以下のパラメータをカスタマイズできます:

| パラメータ名             | 説明                                    | デフォルト値                              |
| ------------------------ | --------------------------------------- | ----------------------------------------- |
| allowedIpV4AddressRanges | フロントエンド WAF で許可する IPv4 範囲 | ["0.0.0.0/1", "128.0.0.0/1"] (すべて許可) |
| allowedIpV6AddressRanges | フロントエンド WAF で許可する IPv6 範囲 | ["0000::/1", "8000::/1"] (すべて許可)     |

### パラメータ指定方法

#### 1. parameter.ts で設定（推奨）

`cdk/lib/parameter.ts` ファイルを直接編集する方法:

```typescript
// cdk/lib/parameter.ts
export const parameters = {
  // カスタマイズしたいパラメータのみコメントを外して設定

  // WAF IP制限の設定例
  allowedIpV4AddressRanges: [
    "192.168.0.0/16", // 内部ネットワーク例
    "203.0.113.0/24", // 特定のパブリックIP範囲例
  ],

  allowedIpV6AddressRanges: [
    "2001:db8::/32", // IPv6アドレス範囲例
  ],
};
```

#### 2. コマンドラインで context パラメータとして指定

```bash
# ドット表記形式
cdk deploy --context rapid.allowedIpV4AddressRanges='["192.168.0.0/16", "203.0.113.0/24"]'

# または JSON 形式
cdk deploy --context rapid='{"allowedIpV4AddressRanges":["192.168.0.0/16"]}'
```

## セキュリティ考慮事項

### フロントエンドアクセス制限

セキュリティ強化のため、フロントエンドへのアクセスを必要な IP アドレス範囲のみに制限することを強く推奨します。デフォルト設定ではすべての IP アドレスからのアクセスが許可されています。

上記の「パラメータカスタマイズ」セクションを参照して、WAF による IP アドレス制限を設定してください。

### 認証と認可

- Amazon Cognito による認証
- S3 プリサインド URL による安全なドキュメントアクセス
- すべてのレイヤーでの入力検証
- すべての操作の監査証跡

### データ保護

- 保存データの暗号化
- S3 バケットポリシーによるアクセス制御
- Lambda と Step Functions による安全な処理
