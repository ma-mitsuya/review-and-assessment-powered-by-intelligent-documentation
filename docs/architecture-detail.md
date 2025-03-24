# BEACON アプリケーション 更新版 AWS アーキテクチャ設計

## 1. アプリケーション概要

BEACON（Building & Engineering Approval Compliance Navigator）は、不動産業界向けの AI ドキュメント適合性チェックシステムです。このシステムは、申請書類や契約書が規制やチェックリストに適合しているかを自動的に確認し、人手不足や長時間労働といった業界課題の解決に貢献します。

## 2. 主要機能

- 申請書類（図面、テキスト、表など非構造データ）の自動分析
- チェックリストとの適合性確認
- 人間の判断が必要な箇所の明示
- 多様な文書形式（Word, Excel, PDF, 画像）のサポート

## 3. AWS アーキテクチャ

### 3.1 アーキテクチャ概要

BEACON アプリケーションは、サーバレスアーキテクチャを中心に設計し、スケーラビリティと費用対効果を両立させます。Bedrock からのストリーミングレスポンスに対応するため、API Gateway ではなく CloudFront から Lambda への直接接続を採用します。

### 3.2 コンポーネント構成

#### フロントエンド

- **Amazon CloudFront**: コンテンツ配信ネットワークおよび API リクエストのルーティング
  - Origin Access Identity (NOTE: Origin Access Control 利用は厳禁) を使用して S3 へのアクセスを制限
- **Amazon S3**: 静的ウェブサイトホスティング（React SPA）
- **Amazon Cognito**: ユーザー認証と認可

#### バックエンド API

- **AWS Lambda**: ビジネスロジック処理（TypeScript）
  - CloudFront から直接呼び出し（API Gateway なし）
  - ストリーミングレスポンス対応
- **AWS Lambda Web Adapter**: モノリシックアプローチのサポート

#### ドキュメント処理

- **Amazon S3**: ドキュメントストレージ
- **Amazon Bedrock**: 文書解析と適合性チェック（生成 AI）
  - ストリーミングレスポンス対応モデルを使用
- **AWS Lambda**: ドキュメント処理ワークフロー

#### データストア

- **Amazon DynamoDB**: チェックリスト、ユーザーデータ、分析結果の保存
- **Amazon S3**: 原本ドキュメントの保存

#### 非同期処理

- **Amazon EventBridge**: イベント駆動型処理
- **AWS Step Functions**: 長時間実行ワークフロー

#### モニタリングとログ

- **Amazon CloudWatch**: ログ、メトリクス、アラーム
  - ログ保持期間: 3 ヶ月（90 日）
- **AWS X-Ray**: 分散トレーシング

### 3.3 CI/CD パイプライン

- **GitHub Actions**: 自動テスト実行
  - cdk test, cdk synth の成功可否
  - frontend の build 成功可否
  - frontend の lint 成功可否
  - backend の build 成功可否
  - backend 各テストの成功可否（aws サービスとの連携が不要なもののみ。aws service の挙動シミュレーションはしない（moto3 などは利用しない））
  - コード品質チェック
  - デプロイは含まない（手動デプロイ）

### 3.4 データフロー

#### ユーザー認証フロー

1. ユーザーは Cognito を通じて認証
2. 認証後、JWT トークンを取得し API リクエストに使用

#### ドキュメントアップロードフロー

1. ユーザーがドキュメントをアップロード
2. S3 にドキュメント保存 (presigned-url)
3. SQS にキューイング → 処理ワークフローを開始

#### ドキュメント処理フロー

1. Lambda 関数がドキュメントを取得
2. ドキュメントタイプに応じた前処理（テキスト抽出など）
3. Amazon Bedrock を使用して文書解析（バッチ処理）
4. 最終結果を Aurora Serverless MySQL に保存

#### チェックリスト照合フロー

1. Lambda 関数がドキュメント解析結果とチェックリストを取得
2. Amazon Bedrock を使用して適合性チェック（バッチ処理）
3. 最終結果を Aurora に保存

## 4. CloudFront → Lambda 直接接続の実装

### 4.1 CloudFront 設定

- **オリジン設定**:
  - S3 オリジン: 静的コンテンツ用（Origin Access Identity 使用）
  - Lambda 関数 URL オリジン: API リクエスト用
- **キャッシュ動作**:
  - `/api/*` パスパターンを Lambda 関数 URL にルーティング
  - その他のパスを S3 にルーティング
- **ヘッダー転送**: 認証ヘッダーを Lambda に転送

### 4.2 Lambda

- CORS 設定: フロントエンドドメインを許可
- タイムアウト: 最大 15 分（長時間実行処理用）

### 4.3 ストリーミングレスポンス実装

- クライアント側で Server-Sent Events (SSE) を使用して受信

## 5. CloudWatch Logs 設定

### 5.1 ログ保持期間

- すべての CloudWatch ロググループに 90 日（3 ヶ月）の保持期間を設定

## 6. GitHub Actions CI 設定

### 6.1 ワークフロー構成

- トリガー: プルリクエスト、メインブランチへのプッシュ
- ジョブ:
  - 依存関係インストール
  - リント
  - ユニットテスト
  - 統合テスト

## 7. セキュリティ設計

### 7.1 認証と認可

- **Amazon Cognito**: ユーザー認証とアクセス制御
- **IAM ロール**: 最小権限の原則に基づいたサービス間アクセス制御
- **JWT トークン検証**: Lambda 関数内で実装

### 7.2 S3 セキュリティ

- **Origin Access Identity**: CloudFront からのみ S3 へのアクセスを許可
- **S3 暗号化**: 保存データの暗号化（SSE-S3/KMS）
- **バケットポリシー**: 適切なアクセス制限

### 7.3 データ保護

- **DB 暗号化**: 保存データの暗号化
- **HTTPS**: 転送中のデータ暗号化
- **WAF**: CloudFront と統合して Web アプリケーションを保護

## その他

- アプリケーションリージョンは CDK で設定できるように
  - cdk.json は利用しない。parameter.ts と zod を利用し、すべての CDK パラメータは型安全にすること
  - デフォルト: ap-northeast-1
- Bedrock 用のリージョンは別途設定できるように
  - すべての生成 AI 機能が提供されているとは限らないため
  - デフォルト: us-west-2
- Cloudfront WAF は us-east-1 に作成すること（us-east-1 以外作成不可）
- DB スキーマは別途設計すること
