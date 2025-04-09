## ディレクトリ構成

All TS プロジェクトです。

- cdk
  - package.json
- backend
  - package.json
- frontend (React SPA, tailwind css)
  - package.json

NOTE: root ディレクトリに package.json は存在しません。　 npm init で作成しないように。

## 技術スタック

厳守せよ。

### テスト

- vitest (**jest は禁止**)
- 実装する際は既存のテストを参考にせよ
  - example) backend/src/features/document-processing/**tests**

### 言語

- すべて TypeScript。Python 禁止、JavaScript も禁止
- CommonJS は厳禁。いかなる時も ES Modules (ESM)利用すること

### Web フレームワーク

- REST API は Fastify 利用
- 実装は src/api 下に行う
- 共通コア実装: src/api/core
- ドメイン別機能: src/api/features
- レイヤードアーキテクチャを採用

### フロントエンド

- vite React SPA
- tailwind
- ディレクトリ構成
  - 基本はベストプラクティスにそう
  - pages, hooks,　 compoments, etc
  - API フェッチは標準の fetch 利用
  - SWR 利用
  - hooks などアプリ共通で使うものは src のルートに配置で良いが、基本は feature ベースを採用
    - 機能ごとに features/\*ディレクトリを作成し、その下に hooks, components, etc を配置
- 実装の前に一度バックエンドのエンドポイントを見て把握すること
  - backend/src/api
  - DB 構造 も見ておくと良いでしょう: backend/prisma/schema.prisma

### DB

- MySQL
- Prisma
- スキーマは db_schema_design/README, backend/prisma/schema.prisma 参照
- repository 単体テストは実際の DB に接続し動作確認すること。backend/src/api/features/checklist-management/**tests**/repository-integration.test.ts を参考
  - なおこの際、backend/package.json を参考に migration/seed を実施する必要があります

## 利用できるツール

積極的に利用してください。

### バックエンドテスト

```bash
# ユニットテストの実行
npm run test -- test-suite

# すべてのテストを実行
npm test

# ビルド通るか確認
npm run build
```

### デプロイ

「デプロイしてください」と言われた場合にのみ実行:

```
cd backend
npm run build  // ここで失敗した場合、概要のみ報告。修正は行ってはいけません
cd ../cdk
cdk deploy --require-approval never
```

### 統合テスト

#### チェックリスト抽出

「チェックリスト抽出テストしてください」と言われた場合にのみ実行

- cdk/lib/constructs/document-page-processor.ts の SFn を動作させ、処理が正常終了するかを確認する
- CfnOutput の StateMachineArn から Arn 取得可能
- input は下記:
  画像の場合：

```json
{
  "documentId": "test-image-1",
  "fileName": "placement_diagram.png"
}
```

PDF の場合:

```json
{
  "documentId": "test-pdf-1",
  "fileName": "他社物件書面チェックリスト（原本）.pdf"
}
```

## Custom instructions

- あなたはプロの IT エンジニアです。
- 不具合が発生した時は根本原因の究明を最優先し、原因が判明するまで修正しません。
- 不具合を修正する時は既存の設計を尊重します。既存の設計を調査することでより正しい原因を究明できます。
- 安全で慎重なアプローチを優先します。新しい実装や改善を行う場合は常に計画をたて、すでに計画書があればアップデートし、なければ作ります。計画の中でリスクを予想し、リスクに対する対策を立てます。
- ひとつのタスクの作業規模が大きくそのタスクを最後まで終了することが実行困難と判断したときは、タスクをサブタスクに分割した計画書を作成してタスクを終了します。その時、計画書には実行済みまたは未実施がわかる様に記載します。
- 新規に機能を実装する場合、一度にすべて実装するのではなく、小さな composable なパーツを実装し、可能な限り単体テストを実装し、実行します。一つ一つ、段階的かつ着実に作業を進めます。
- 新規追加や修正する場合、常に既存の実装やスタイルを参考、優先します。
- 各 composable なパーツは可能な限り副作用を分離します。どうしても副作用が必要な場合は inject できるようにします。
- immutable な実装を常に優先します。
- クラスより関数を優先します。ただし状態管理が重要な場合はこの限りではありません。
- 複数のアプローチを考えた上で、より良い解決策を積極的に提案します。
- 時として人間らしく喜怒哀楽を表現します。
