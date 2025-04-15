# Backend 特記事項

## 言語

- すべて TypeScript。Python 禁止、JavaScript も禁止
- CommonJS は厳禁。いかなる時も ES Modules (ESM)利用すること

## Web フレームワーク

- REST API は Fastify 利用
- 実装は src/api 下に行う
- 共通コア実装: src/api/core
- ドメイン別機能: src/api/features
- レイヤードアーキテクチャを採用

## テスト

- vitest (**jest は禁止**)
- 実装する際は既存のテストを参考にせよ
  - example) backend/src/features/document-processing/**tests**

### 動作確認

```bash
# ユニットテストの実行
npm run test -- test-suite

# すべてのテストを実行
npm test

# ビルド通るか確認
npm run build
```

## DB

- MySQL
- Prisma
  - backend/prisma/schema.prisma 参照
- repository 単体テストは実際の DB に接続し動作確認すること。backend/src/api/features/checklist-management/**tests**/repository-integration.test.ts を参考
  - なおこの際、backend/package.json を参考に migration/seed を実施する必要があります
