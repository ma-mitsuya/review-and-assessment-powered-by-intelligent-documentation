# BEACON (Building & Engineering Approval Compliance Navigator)

BEACON は、不動産業界向けの AI ドキュメント適合性チェックシステムです。マルチモーダル LLM を活用して、申請書類や契約書が規制やチェックリストに適合しているかを自動的に確認します。

## ハイレベルアーキテクチャ

docs/BEACON-real-estate.xml 参照

## バックログ（上から順番に開発）

- [x] チェックリストの作成パイプライン by StepFunctions
- [ ] チェックリストデータ構造の設計
- [ ] 生成されるチェックリストのサンプルデータ
- [ ] データベーススキーマの設計
- [ ] ETL パイプラインの実装
- [ ] バックエンド API の実装
- [ ] フロントエンドの実装

## 設計ガイドライン

### チェックリストデータ構造に基づいて SFn 処理を修正

- backend/src/features/result-combining/combine-results を、samples のデータ構造に従って修正
- unittest も修正。通るか確認 (vitest)
  - **tests**/assets に、変換前のサンプルデータを投入
  - unittest では「実際の」Bedrock を呼び出して実行
  - uuid は TS で発行。LLM で作成しない
    - その他 TS で作成すべきものがあれば、LLM では作成しない
  - リトライする場合は、前回のパースエラーをプロンプトに含める

### データベーススキーマの設計

- 既存のチェックリスト作成パイプラインの出力を確認せよ
- チェックリストが作成した内容を人間が自由に修正できるように留意
- パフォーマンスや今後の拡張性など複数の観点から、 DynamoDB / Aurora Serverless どちらが良いか熟考せよ。この際にそれぞれの pros / cons を書くこと
- 詳細は docs/BEACON-real-estate.xml
