# 開発者ガイド

このガイドは 本サンプルの開発者向け情報をまとめたものです。

> [!Note]
> このリポジトリのコードは８割以上が生成 AI コーディングツールである[Amazon Q Developer CLI](https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/command-line.html)および[Cline](https://github.com/cline/cline) with Bedrock で書かれています。サンプルのカスタマイズの際に検討をおすすめします。

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

   - [Amazon S3](https://aws.amazon.com/s3/) でホストされた [React](https://react.dev/) アプリケーション
   - [Amazon CloudFront](https://aws.amazon.com/cloudfront/) による配信
   - [AWS WAF](https://aws.amazon.com/waf/) によるセキュリティ保護

2. **認証/認可**:

   - [Amazon Cognito](https://aws.amazon.com/cognito/) による認証管理

3. **API レイヤー**:

   - [Amazon API Gateway](https://aws.amazon.com/api-gateway/)
   - [AWS Lambda](https://aws.amazon.com/lambda/) + [AWS Lambda Web Adapter](https://github.com/awslabs/aws-lambda-web-adapter) による [Fastify](https://fastify.dev/) REST API

4. **処理レイヤー**:

   - [AWS Step Functions](https://aws.amazon.com/step-functions/) による文書処理ワークフロー
   - [AWS Lambda](https://aws.amazon.com/lambda/)関数によるドキュメント分析
   - [Amazon Bedrock](https://aws.amazon.com/bedrock/) による AI/ML 処理

5. **データレイヤー**:
   - [Amazon RDS/Aurora](https://aws.amazon.com/jp/rds/) (MySQL) によるデータベース
   - [Amazon S3](https://aws.amazon.com/s3/) によるドキュメントストレージ

## ローカル開発環境

### 前提条件

- Node.js (v22 推奨)
- Docker と Docker Compose
- AWS CLI

### 環境構築

事前に CDK によるデプロイを行った後、下記の手順を行ってください。

1. **ローカルデータベースの起動**

   ```bash
   # ルートディレクトリで実行
   docker-compose -f assets/local/docker-compose.yml up -d
   ```

2. **バックエンドの準備**

   ```bash
   cd backend
   npm ci

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
   cp .env.example .env.local
   # CDKデプロイ後の値に応じて.env.local を編集

   # 開発サーバー起動
   npm run dev
   ```

## コード規約

[.amazonq/rules](../.amazonq/rules)を参照してください。
