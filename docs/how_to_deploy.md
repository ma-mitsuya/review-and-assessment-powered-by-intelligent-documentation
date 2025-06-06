## デプロイ手順

### 前提条件

- AWS アカウント
- AWS CLI (設定済み)
- Node.js (v18 以上)
- Docker (macOS でのデプロイ時に必要)

### 方法1: CodeBuildを使用したデプロイ（推奨）

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

スクリプトは、CloudFormationを使用してCodeBuildプロジェクトを作成し、そのプロジェクトがRAPIDアプリケーションをデプロイします。

### 方法2: ローカル環境からのデプロイ

ローカル環境で必要なツールをインストールしてデプロイする方法です。

#### 自動化スクリプトを使用したデプロイ

一連のデプロイ手順を自動化するスクリプトを用意しています。このスクリプトは環境チェック、リソースのデプロイ、マイグレーションの実行を自動的に行います。

```bash
# プロジェクトルートディレクトリから実行
./deploy.sh
```

スクリプトは以下の手順を自動的に実行します：

1. 環境のチェック（Docker、AWS CLI）
2. MySQL コンテナの起動（必要な場合）
3. バックエンドの依存関係インストールとビルド
4. マイグレーションファイルの確認と作成
5. CDK によるAWSリソースのデプロイ
6. データベースマイグレーションの実行
7. デプロイ情報（フロントエンドURLとAPI URL）の表示
8. MySQL コンテナの停止（スクリプトが起動した場合）

#### 手動でのデプロイ手順

自動化スクリプトを使用せず、手動で各ステップを実行する場合は以下の手順に従ってください。

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

### データベースマイグレーションについて

データベースマイグレーションは、デプロイ方法によって異なる挙動をします：

1. **CodeBuildデプロイ（bin.sh）**: `--auto-migrate` パラメータで制御します（デフォルトは `true`）
2. **ローカルデプロイ（deploy.sh）**: CDKデプロイ完了後に自動的に実行されます

> [!Warning]
> デフォルトでは `autoMigrate` パラメータが `true` に設定されており、デプロイ時に自動的にデータベースマイグレーションが実行されます。本番環境や重要なデータを含む環境では、このパラメータを `false` に設定し、マイグレーションを手動で制御することを検討してください。

**注意**: `autoMigrate` が `false` の場合、手動でのマイグレーション実行が必要です。

### デプロイリセット（環境のクリーンアップ）

開発環境をリセットする必要がある場合は、以下のコマンドでマイグレーションをリセットできます：

```bash
# リセットコマンドを取得して実行
RESET_COMMAND=$(aws cloudformation describe-stacks --stack-name RapidStack --query "Stacks[0].Outputs[?OutputKey=='ResetMigrationCommand'].OutputValue" --output text)
eval $RESET_COMMAND
```

**注意**: これにより、データベースのすべてのデータが削除されます。本番環境では絶対に実行しないでください。

### トラブルシューティング

1. **Docker関連の問題**
   - macOS でデプロイする場合、Docker が起動していることを確認してください。
   - CDK は Lambda 関数のビルドに Docker を使用します。

2. **マイグレーションエラー**
   - 自動マイグレーションが失敗した場合は、CloudWatch Logsで「MigrationProviderLambda」関数のログを確認してください。
   - 問題が解決しない場合は、以下の方法で手動実行を試みることができます：

     **AWS CLI を使用**:
     ```bash
     # StackのOutputからマイグレーションコマンドを取得して実行
     MIGRATION_COMMAND=$(aws cloudformation describe-stacks --stack-name RapidStack --query "Stacks[0].Outputs[?OutputKey=='DeployMigrationCommand'].OutputValue" --output text)
     eval $MIGRATION_COMMAND
     ```

     **AWS Management Consoleを使用**:
     1. AWS Management Console で、Lambda サービスに移動
     2. `RapidStack-PrismaMigrationMigrationFunction~` という名前の Lambda 関数を検索して選択
     3. 「テスト」タブを選択
     4. 以下の JSON をテストイベントとして設定
        ```json
        {
          "command": "deploy"
        }
        ```
     5. 「テスト」ボタンをクリックして実行

3. **Prisma生成エラー**
   - `prisma:generate` コマンドでエラーが発生した場合、`node_modules/.prisma` ディレクトリを削除して再試行してください。
