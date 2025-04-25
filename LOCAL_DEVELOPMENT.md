# BEACON ローカル開発環境セットアップ

このドキュメントでは、BEACON（Building & Engineering Approval Compliance Navigator）のローカル開発環境のセットアップ方法について説明します。

## 前提条件

- Node.js (v18 以上)
- Docker および Docker Compose
- AWS CLI（設定済み）

## バックエンドのセットアップ

### 1. データベースの起動

プロジェクトのルートディレクトリで以下のコマンドを実行し、MySQL データベースを起動します：

```bash
docker-compose up -d
```

これにより、以下の設定で MySQL データベースが起動します：

- ホスト: localhost
- ポート: 3306
- データベース名: beacon_db
- ユーザー名: beacon_user
- パスワード: beacon_password

注意: Docker 起動時に自動的に`mysql-init/01-grant-permissions.sql`が実行され、`beacon_user`に必要な権限が付与されます。ただし、既存のデータボリュームがある場合（一度起動した後）は初期化スクリプトは実行されません。その場合は、以下のいずれかの方法で対応してください：

1. ボリュームを削除して再作成する：

```bash
docker-compose down -v
docker-compose up -d
```

2. 手動で権限を付与する：

```bash
docker exec -it beacon-mysql mysql -uroot -ppassword -e "GRANT ALL PRIVILEGES ON *.* TO 'beacon_user'@'%'; FLUSH PRIVILEGES;"
```

### 2. バックエンドの依存関係インストール

```bash
cd backend
npm ci
npm run prisma:generate  # Prismaクライアントの生成
```

### 3. データベースのマイグレーションと初期データ投入

```bash
cd backend
npm run prisma:migrate   # データベースのマイグレーション
npm run db:seed         # 初期データの投入
```

### 4. バックエンドサーバーの起動

```bash
cd backend
npm run dev
```

バックエンドサーバーは http://localhost:3000 で起動します。

## フロントエンドのセットアップ

### 1. 依存関係のインストール

```bash
cd frontend
npm install
```

### 2. 環境変数の設定

フロントエンドディレクトリに `.env.local` ファイルが既に作成されています。必要に応じて編集してください。

### 3. 開発サーバーの起動

```bash
cd frontend
npm run dev
```

フロントエンドの開発サーバーは http://localhost:5173 で起動します。

## 動作確認

1. バックエンド API: http://localhost:3000/api/health にアクセスして、正常に応答があることを確認します。
2. フロントエンド: http://localhost:5173 にアクセスして、アプリケーションが表示されることを確認します。

## データベース管理

Prisma Studio を使用してデータベースを視覚的に管理できます：

```bash
cd backend
npm run prisma:studio
```

Prisma Studio は http://localhost:5555 で起動します。

## テスト実行

バックエンドのテストを実行するには：

```bash
cd backend
npm test
```

特定のテストスイートのみを実行するには：

```bash
cd backend
npm run test -- test-suite
```

## ビルド

バックエンドをビルドするには：

```bash
cd backend
npm run build
```

フロントエンドをビルドするには：

```bash
cd frontend
npm run build
```

## トラブルシューティング

### データベース接続エラー

データベース接続エラーが発生した場合は、以下を確認してください：

1. Docker コンテナが実行中であることを確認：

   ```bash
   docker ps
   ```

2. データベース接続情報が正しいことを確認：

   ```bash
   cat backend/.env
   ```

3. 必要に応じてデータベースコンテナを再起動：
   ```bash
   docker-compose restart mysql
   ```

### Prisma マイグレーションエラー

Prisma マイグレーションでシャドウデータベースの作成エラーが発生した場合：

```
Error: P3014
Prisma Migrate could not create the shadow database. Please make sure the database user has permission to create databases.
```

これは、`beacon_user`ユーザーに`CREATE DATABASE`権限がない場合に発生します。以下の対処法を試してください：

1. Docker 起動時に自動的に権限が付与されるはずですが、既存のボリュームがある場合は初期化スクリプトが実行されません。その場合は、ボリュームを削除して再作成します：

   ```bash
   docker-compose down -v
   docker-compose up -d
   ```

2. または、手動で権限を付与します：

   ```bash
   docker exec -it beacon-mysql mysql -uroot -ppassword -e "GRANT ALL PRIVILEGES ON *.* TO 'beacon_user'@'%'; FLUSH PRIVILEGES;"
   ```

3. 権限が正しく設定されているか確認：
   ```bash
   docker exec -it beacon-mysql mysql -uroot -ppassword -e "SHOW GRANTS FOR 'beacon_user'@'%';"
   ```

### その他の問題

その他の問題が発生した場合は、各ディレクトリのログを確認し、必要に応じて依存関係を再インストールしてください。
