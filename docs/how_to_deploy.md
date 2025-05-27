## デプロイ手順

### 前提条件

- Node.js (v18 以上)
- AWS CLI (設定済み)
- AWS CDK (インストール済み)
- TypeScript (グローバルまたはプロジェクト内)
- Docker (macOS でのデプロイ時に必要)

### デプロイ手順

```bash
# MySQLのDockerコンテナを起動
docker-compose up -d

# バックエンドの準備
cd backend
npm ci
npm run prisma:generate  # Prismaクライアントの生成

# マイグレーションファイルの作成（初回のみ）
npm run prisma:migrate   # マイグレーション名を求められたら「migrations」と入力

# backend/prisma/migrations ディレクトリが作成されたことを確認
ls -la prisma/migrations

# ビルド
npm run build

# CDKのデプロイ
cd ../cdk
npm ci
npm run build
cdk deploy --all --require-approval never

# ローカルMySQLの停止（データボリュームも削除）
cd ..
docker-compose down -v
```

**注意**: macOS でデプロイする場合、Docker が起動していることを確認してください。CDK は Lambda 関数のビルドに Docker を使用します。

デプロイが完了すると、以下の情報が出力されます：

- フロントエンド URL
- API エンドポイント URL
- ドキュメントバケット名
- ステートマシン ARN

### デプロイ後の初期設定

デプロイ完了後、以下の手順が必要です。

#### Prisma マイグレーションを実行

1. AWS Management Console で、Lambda サービスに移動
2. `BeaconStack-PrismaMigrationMigrationFunction~` という名前の Lambda 関数を検索して選択
3. 「テスト」タブを選択
4. 以下の JSON をテストイベントとして設定
   ```json
   {
     "command": "deploy"
   }
   ```
5. 「テスト」ボタンをクリックして実行
6. 実行が成功すると、データベースのマイグレーションが完了します
