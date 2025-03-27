# BEACON (Building & Engineering Approval Compliance Navigator)

BEACON は、不動産業界向けのAIドキュメント適合性チェックシステムです。マルチモーダルLLMを活用して、申請書類や契約書が規制やチェックリストに適合しているかを自動的に確認します。

## 機能

- 様々な形式のドキュメント（PDF、Word、Excel、画像）の処理
- マルチモーダルLLMを使用したドキュメント解析
- チェックリストとの適合性評価
- 構造化されたレポート生成

## 開発環境のセットアップ

### 前提条件

- Node.js 18以上
- AWS CLI（設定済み）
- AWS Bedrockへのアクセス権限

### インストール

```bash
# リポジトリのクローン
git clone https://github.com/yourusername/beacon.git
cd beacon

# バックエンドの依存関係をインストール
cd backend
npm install

# フロントエンドの依存関係をインストール
cd ../frontend
npm install
```

### 環境変数の設定

`.env` ファイルをバックエンドディレクトリに作成し、以下の変数を設定します：

```
AWS_REGION=us-west-2
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
S3_BUCKET_NAME=beacon-documents
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

## アーキテクチャ

詳細なアーキテクチャ情報は [AmazonQ.md](./AmazonQ.md) を参照してください。

## TODO

- [ ] フロントエンドの実装
- [ ] ユーザー認証の追加
- [ ] チェックリスト管理機能の実装
- [ ] レポート生成機能の強化
- [ ] パフォーマンス最適化
