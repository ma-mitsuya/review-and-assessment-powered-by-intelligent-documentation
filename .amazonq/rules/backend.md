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

# バックエンドコーディング規約

## 基本原則

• 言語: TypeScript（ESM 形式）のみ使用
• アーキテクチャ: レイヤードアーキテクチャを採用
• データベース: Prisma を使用した MySQL 接続

## ディレクトリ構造

src/api/features/{機能名}/
├── domain/ # ドメインレイヤー
│ ├── model/ # ドメインモデル
│ ├── service/ # ドメインサービス
│ └── repository.ts # リポジトリインターフェースと実装
├── usecase/ # ユースケースレイヤー
│ └── {機能単位}.ts # 機能単位のユースケース実装
└── routes/ # プレゼンテーションレイヤー
├── index.ts # ルート定義
└── handlers.ts # ハンドラー実装

## レイヤー構成と責務

### 1. ドメインレイヤー (domain/)

責務: ビジネスロジックとドメインモデルの定義

#### モデル (model/)

• ドメインエンティティの型定義
• ドメインオブジェクトの変換ロジック

具体例:
typescript
// domain/model/checklist.ts
export interface CheckListSetModel {
id: string;
name: string;
description: string;
documents: ChecklistDocumentModel[];
}

export const CheckListSetDomain = {
fromCreateRequest: (req: CreateChecklistSetRequest): CheckListSetModel => {
// リクエストからドメインモデルへの変換ロジック
}
};

#### リポジトリ (repository.ts)

• データアクセスのインターフェース定義
• データベース操作の実装

具体例:
typescript
// domain/repository.ts
export interface CheckRepository {
storeCheckListSet(params: { checkListSet: CheckListSet }): Promise<void>;
findAllCheckListSets(): Promise<CheckListSetMetaModel[]>;
}

export const makePrismaCheckRepository = (
client: PrismaClient = prisma
): CheckRepository => {
// 実装
};

### 2. ユースケースレイヤー (usecase/)

責務: アプリケーションのユースケース実装、ドメインオブジェクトの操作

• 機能単位でファイルを分割
• 依存性注入パターンを使用（テスト容易性向上）
• ドメインレイヤーのみに依存

具体例:
typescript
// usecase/checklist-set.ts
export const createChecklistSet = async (params: {
req: CreateChecklistSetRequest;
deps?: {
repo?: CheckRepository;
};
}): Promise<void> => {
const repo = params.deps?.repo || await makePrismaCheckRepository();
const checkListSet = CheckListSetDomain.fromCreateRequest(req);
await repo.storeCheckListSet({ checkListSet });
};

### 3. プレゼンテーションレイヤー (routes/)

責務: HTTP リクエスト/レスポンスの処理、ルーティング

#### ルート定義 (index.ts)

• エンドポイントの定義
• ハンドラーの登録

具体例:
typescript
// routes/index.ts
export function registerChecklistRoutes(fastify: FastifyInstance): void {
fastify.get("/checklist-sets", {
handler: getAllChecklistSetsHandler,
});

fastify.post("/checklist-sets", {
handler: createChecklistSetHandler,
});
}

#### ハンドラー (handlers.ts)

• リクエストのバリデーション
• ユースケースの呼び出し
• レスポンスの整形

具体例:
typescript
// routes/handlers.ts
export const createChecklistSetHandler = async (
request: FastifyRequest<{ Body: CreateChecklistSetRequest }>,
reply: FastifyReply
): Promise<void> => {
await createChecklistSet({
req: request.body,
});

reply.code(200).send({
success: true,
data: {},
});
};

## 設計原則

1. 依存方向の一方向性
   • routes → usecase → domain の方向のみ依存
   • 逆方向の依存は禁止

2. 依存性注入
   • テスト容易性のため、外部依存はパラメータで注入
   • デフォルト実装を提供し、使いやすさも確保

3. 型安全性
   • インターフェースと型定義を明確に
   • リクエスト/レスポンスの型を明示的に定義

4. エラーハンドリング
   • ドメイン固有のエラーを定義
   • 適切な HTTP ステータスコードへのマッピング

5. トランザクション管理
   • 複数の操作を伴う場合はトランザクションを使用

## StepFunctions ハンドラーの設計

- src/checklist-workflow, src/review-workflow など
- prisma client の呼び出しは厳禁。必ず repository 経由でデータにアクセスする
