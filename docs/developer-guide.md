# 開発者ガイド

このガイドは 本サンプルの開発者向け情報をまとめたものです。

## 目次

- [アーキテクチャ](#アーキテクチャ)
- [技術スタック](#技術スタック)
- [ローカル開発環境](#ローカル開発環境)
- [コード規約](#コード規約)
- [テスト](#テスト)
- [デプロイ](#デプロイ)
- [パラメータカスタマイズ](#パラメータカスタマイズ)

## アーキテクチャ

![](./imgs/arch.png)

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

### デプロイ方法

RAPIDのデプロイには以下の2つの方法があります：

#### 1. CodeBuildを使用したデプロイ（推奨）

ローカル環境に依存せず、AWS CodeBuildを使用してクラウド上でデプロイする方法です。

```bash
# プロジェクトルートディレクトリから実行
./bin.sh
```

カスタムパラメータを指定することも可能です：

```bash
./bin.sh --ipv4-ranges '["192.168.0.0/16"]' --auto-migrate false
```

利用可能なオプション：
- `--ipv4-ranges`: フロントエンドWAFで許可するIPv4アドレス範囲（JSON配列形式）
- `--ipv6-ranges`: フロントエンドWAFで許可するIPv6アドレス範囲（JSON配列形式）
- `--disable-ipv6`: IPv6サポートを無効にする
- `--auto-migrate`: デプロイ時に自動的にデータベースマイグレーションを実行するかどうか
- `--cdk-json-override`: CDK設定をオーバーライドするためのJSON文字列
- `--repo-url`: デプロイするリポジトリのURL
- `--branch`: デプロイするブランチ名

詳細は [デプロイガイド](./how_to_deploy.md) を参照してください。

#### 2. ローカル環境からのデプロイ

ローカル環境で必要なツールをインストールしてデプロイする方法です。

```bash
# プロジェクトルートディレクトリから実行
./deploy.sh
```

詳細は [デプロイガイド](./how_to_deploy.md) を参照してください。

## パラメータカスタマイズ

### CDK デプロイ時のパラメータカスタマイズ

CDK デプロイ時に以下のパラメータをカスタマイズできます:

| パラメータ名             | 説明                                    | デフォルト値                              |
| ------------------------ | --------------------------------------- | ----------------------------------------- |
| allowedIpV4AddressRanges | フロントエンド WAF で許可する IPv4 範囲 | ["0.0.0.0/1", "128.0.0.0/1"] (すべて許可) |
| allowedIpV6AddressRanges | フロントエンド WAF で許可する IPv6 範囲 | ["0000::/1", "8000::/1"] (すべて許可)     |
| autoMigrate              | デプロイ時に自動的にマイグレーションを実行するかどうか | true (自動実行する) |

> [!Warning]
> デフォルトでは `autoMigrate` パラメータが `true` に設定されており、デプロイ時に自動的にデータベースマイグレーションが実行されます。本番環境や重要なデータを含む環境では、このパラメータを `false` に設定し、マイグレーションを手動で制御することを検討してください。

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
  
  autoMigrate: false, // 自動マイグレーションを無効化
};
```

#### 2. コマンドラインで context パラメータとして指定

```bash
# ドット表記形式
cdk deploy --context rapid.allowedIpV4AddressRanges='["192.168.0.0/16", "203.0.113.0/24"]'

# または JSON 形式
cdk deploy --context rapid='{"allowedIpV4AddressRanges":["192.168.0.0/16"]}'

# 自動マイグレーションを無効化する例
cdk deploy --context rapid.autoMigrate=false
```

#### 3. CodeBuildデプロイ時にパラメータを指定

```bash
./bin.sh --ipv4-ranges '["192.168.0.0/16"]' --auto-migrate false
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
