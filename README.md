# BEACON (Building & Engineering Approval Compliance Navigator)

BEACON は、不動産業界向けの AI ドキュメント適合性チェックシステムです。マルチモーダル LLM を活用して、申請書類や契約書が規制やチェックリストに適合しているかを自動的に確認します。

## ハイレベルアーキテクチャ

docs/BEACON-real-estate.xml 参照

## バックログ（上から順番に開発）

- [x] チェックリストの作成パイプライン by StepFunctions
- [x] チェックリストデータ構造の設計
- [x] 生成されるチェックリストのサンプルデータ
- [ ] データベーススキーマの設計
- [ ] ETL パイプラインの実装
- [ ] バックエンド API の実装
- [ ] フロントエンドの実装

## 設計ガイドライン

### combine-result

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

### データベーススキーマの設計

- あなたが「書き換えて」よい場所は db_schema_design/のみです
- samples/にある csv ファイルおよび backend/src/features/result-combining/prompt.ts のプロンプト内容を把握し、RDB(MySQL)のスキーマを設計してください
- チェックリストの自動作成は以下の流れで行われます。
  - ユーザーが UI からアップロード
  - SFn(cdk/lib/constructs/document-page-processor.ts)が実行される
  - S3 バケットに CSV 結果が出力される (samples/にある CSV)
  - ETL で上記 RDB に格納される
    - backend/features/csv-etl に仮実装がありますが、これは参考にしてはいけません
  - ユーザーはこの RDB を WebApp で開き、自動抽出されたアイテムを編集できる
    - LLM が抽出したものが正しいとは限らないため
    - 変更した履歴は不要
- db_schema_design に設計した結果を出力してください。このとき「なぜその設計が良いのか」説明してください
