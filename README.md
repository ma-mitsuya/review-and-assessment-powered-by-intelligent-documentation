# BEACON (Building & Engineering Approval Compliance Navigator)

BEACON は、不動産業界向けの AI ドキュメント適合性チェックシステムです。マルチモーダル LLM を活用して、申請書類や契約書が規制やチェックリストに適合しているかを自動的に確認します。

## ハイレベルアーキテクチャ

docs/BEACON-real-estate.xml 参照

## バックログ（上から順番に開発）

- [x] チェックリストの作成パイプライン by StepFunctions
- [x] チェックリストデータ構造の設計
- [x] 生成されるチェックリストのサンプルデータ
- [x] データベーススキーマの設計
- [ ] ETL パイプラインの実装
- [ ] バックエンド API の実装
- [ ] フロントエンドの実装

## 残タスク

#### チェックリスト作成の修正

- backend/src/features/result-combining/combine-results.ts 作りなおし。
- JSON 　で出力する
- 実際の Bedrock(Claude Sonnet 3.7)をコールする integ test も実装すること

#### ローカル開発環境の整備

- LOCAL_DEVELOPMENT.md の migrate で失敗する。原因調査
  > beacon-backend@1.0.0 prisma:migrate
  > prisma migrate dev

Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": MySQL database "beacon_db" at "localhost:3306"

Error: P3014

Prisma Migrate could not create the shadow database. Please make sure the database user has permission to create databases. Read more about the shadow database (and workarounds) at https://pris.ly/d/migrate-shadow

Original error: Error code: P1010

User `beacon_user` was denied access on the database `beacon_db`

#### 実装すべきエンドポイント

###### チェックリストセット管理

1. **チェックリストセットの取得**

   - 全てのチェックリストセットを一覧表示するエンドポイント

2. **チェックリストセットの作成**

   - 新しいチェックリストセットを作成するエンドポイント
   - 名前や説明などの基本情報を含める

3. **チェックリストセットの更新・削除**
   - 既存のチェックリストセットを編集・削除するエンドポイント

###### チェックリスト項目管理

4. **チェックリスト項目の取得**

   - 指定されたセットに属するチェック項目を階層構造で取得
   - item_type に基づいて適切にフォーマットされたデータを返す

5. **チェックリスト項目の作成・編集**
   - 新しいチェック項目の追加や既存項目の編集
   - フロー型と単純チェック型の両方をサポート

###### ファイル管理

6. **ファイルのアップロード**

   - 契約書や Excel ファイルなどのアップロード処理
   - 対応するチェックリストセットとの関連付け

7. **ファイルの一覧取得**
   - チェックリストセットごとのファイル一覧表示
   - ファイルのメタデータを含む

###### LLM 処理と結果管理

8. **文書の LLM 分析**

   - アップロードされたファイルを LLM で分析し、チェックリスト項目と照合
   - 抽出されたテキストや適合性判断を返す

9. **LLM 分析結果の取得**

   - 特定のドキュメントに対する LLM 分析結果を取得
   - 適合/不適合項目の一覧やフロー判断の結果を含む

10. **分析結果の修正**
    - LLM が判断した結果をユーザーが修正するためのエンドポイント
    - 修正履歴の保存と追跡

###### フロー評価

11. **フローチャート評価の実行**

    - 特定のドキュメントに対し、フローチャート型のチェックリストを評価
    - 最初の項目から開始して、LLM 判断に基づき分岐をたどる

12. **フロー評価結果の視覚化データ取得**
    - フローチャート評価の結果を視覚的に表示するためのデータを取得
    - たどったパスや最終結論を含む

###### ユーザー管理

13. **操作履歴の取得**
    - ユーザーごとの操作履歴や修正履歴の取得

### combine-result の修正

- ドキュメント ID とページナンバーを出力させる
  - LLM ではなく TS で
  - meta_data (json) atrribute で表現

```json
"meta_data": {
   "document_id": "xxx",
   "page_number": 123
}
```

- csv から json へ変更
- モデルは Sonnet 3.7
