# BEACON アプリケーション開発指示書

## 前提条件（重要）

- 開発を始める前に、**docs 下のドキュメントにすべて目を通してください。**
- 技術的な詳細に関する知識で不明な点がある場合、q_dev_tools/internet.py をツールとして積極的に利用してください。使い方:

```
python3 internet_search.py "検索クエリ" --limit 5 --lang ja
```

## 用語定義

- 審査対象:契約書、申請書（図面、テキスト、表含む）など。詳細は PRFAQ 参考
- チェックリスト:審査する際に照らし合わせで利用するチェックリスト。詳細は PRFAQ 参考

## 1. プロジェクト概要

BEACON（Building & Engineering Approval Compliance Navigator）は、不動産業界向けの AI ドキュメント適合性チェックシステムです。このシステムは、申請書類や契約書が規制やチェックリストに適合しているかを自動的に確認し、人手不足や長時間労働といった業界課題の解決に貢献します。

本ドキュメントは、BEACON の AWS 上でのサーバレスアーキテクチャ設計、開発アプローチ、ディレクトリ構造、および実装ステップを定義します。なお PRFAQ は[prfaq.md](./prfaq.md)、ドラフトアーキテクチャは[BEACON-real-estate.xml](./BEACON-real-estate.xml)をそれぞれ参照してください。

### 主要機能

- 申請書類（図面、テキスト、表など非構造データ）の自動分析
- チェックリストとの適合性確認
- 人間の判断が必要な箇所の明示
- 多様な文書形式（Word, Excel, PDF, 画像）のサポート

## 2. アーキテクチャ設計

### 2.1 具体的なサービス構成

AWS であれば何のサービスを利用して構いません。基本的にサーバレス中心とし、スモールスタートできる必要があります。以下はサービス例ですが、以下のサービスに限定する必要はありません。

- **Amazon Cognito**: ユーザー認証と認可
- **Amazon API Gateway**: RESTful API 実装
- **AWS Lambda**: 処理ロジック実装
- **aws-lambda-web-adapter**: モノリシックアプローチ
- **ECS**: 処理ロジック実装
- **Amazon DynamoDB**: 構造化データ（チェックリスト、結果等）保存
- **Amazon S3**: ドキュメントファイル保存
- **Amazon Bedrock**: 文書解析や照合処理の生成 AI 実装
- **Amazon CloudFront**: フロントエンドのコンテンツ配信
- **AWS EventBridge**: 非同期処理のイベント管理
- **AWS CloudWatch**: ログとモニタリング
- **AWS CloudFormation/CDK**: インフラストラクチャ管理

### 2.2 インフラコード

後のステップで CDK で実装を行います。適宜 implementation-examples を参照し、実装可能性も検証してください。

### 2.3 データフロー図

BEACON-real-estate.xml を確認すること。

## 3. 開発アプローチ

### 3.1 技術スタック

- **フロントエンド**: React SPA, TypeScript, Vite, Tailwind CSS, zustand, SWR, amplify（認証画面のみ）
- **バックエンド**: AWS Lambda (TypeScript), Lambda web adapter, fastify, AWS CDK
- **テスト**: Jest, TDD 手法
- その他ライブラリは必須の場合のみ導入 (axios は利用せず fetch 使う、など)

### 3.2 プログラミングパラダイム

軽量 DDD と関数型アプローチを採用し、以下の原則に従います：

#### 3.2.1 関数型プログラミング原則

- 純粋関数を優先
  - Class / DI Injection ではなく関数を優先
- 不変データ構造の使用
- 副作用の分離と明示
- 型安全性の確保

#### 3.2.2 軽量ドメイン駆動設計

- 値オブジェクトとエンティティの区別
- 集約による整合性の保証
- リポジトリによるデータアクセスの抽象化

#### 3.2.3 テスト駆動開発(TDD)

- Red-Green-Refactor サイクルの実践
- テストを仕様として扱う
- 小さな単位での反復
- 継続的なリファクタリング

### 3.3 型定義とエラーハンドリング

#### ブランデッド型

タイプセーフティ確保のためブランデッド型パターンを採用します：

```typescript
// 例：ブランデッド型の定義
type Branded<T, B> = T & { readonly _brand: B };
type DocumentId = Branded<string, "DocumentId">;
type ChecklistId = Branded<string, "ChecklistId">;
```

#### Result 型

エラーハンドリングには Result 型を使用し、成功/失敗を明示的に扱います：

```typescript
// 例：Result型の定義
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

// 使用例
function parseDocument(content: string): Result<ParsedDocument, Error> {
  try {
    // パース処理
    return ok(parsedDocument);
  } catch (error) {
    return err(new ParseError("Failed to parse document."));
  }
}
```

#### 値オブジェクト

- 不変
- 値に基づく同一性
- 自己検証
- ドメイン操作を持つ

```typescript
// 作成関数はバリデーション付き
function createMoney(amount: number): Result<Money, Error> {
  if (amount < 0) return err(new Error("負の金額不可"));
  return ok(amount as Money);
}
```

### エンティティ

- ID に基づく同一性
- 制御された更新
- 整合性ルールを持つ

### リポジトリ

- ドメインモデルのみを扱う
- 永続化の詳細を隠蔽
- テスト用のインメモリ実装を提供

### ドメインサービス

- 利用は最小限。なるべくエンティティまたは値オブジェクトに記述する

### アダプターパターン

- 外部依存を抽象化
- インターフェースは呼び出し側で定義
- テスト時は容易に差し替え可能

## 4. ディレクトリ構成

co-location を念頭に置いた、機能ごとにグループ化されたディレクトリ構造を採用します。LLM が認知しやすいよう、テストも co-locate します。下記はあくまで一例です。合わないと思ったら変更を厭わないように：

```
beacon-project/
├── cdk/                             # インフラストラクチャコード
│   ├── bin/
│   │   └── beacon-app.ts
│   ├── lib/
│   │   ├── beacon-stack.ts
│   │   └── constructs/
│   │       ├── api-construct.ts
│   │       ├── auth-construct.ts
│   │       ├── storage-construct.ts
│   │       └── frontend-construct.ts  # NodeJsBuildを利用
│
├── frontend/                        # フロントエンドアプリケーション
│   ├── public/
│   ├── src/
│   │   ├── app/                     # アプリケーションルート
│   │   │   ├── app.tsx
│   │   ├── features/                # 機能別モジュール
│   │   │   ├── auth/                # 認証機能
│   │   │   │   ├── components/
│   │   │   │   ├── hooks/
│   │   │   │   ├── auth.api.ts
│   │   │   │   ├── auth.types.ts
│   │   │   │   └── auth.test.ts
│   │   │   │
│   │   │   ├── document-management/ # 文書管理機能
│   │   │   │   ├── components/
│   │   │   │   ├── hooks/
│   │   │   │   ├── document.api.ts
│   │   │   │   ├── document.types.ts
│   │   │   │   └── document.test.ts
│   │   │   │
│   │   │   ├── checklist/          # チェックリスト機能
│   │   │   │   ├── components/
│   │   │   │   ├── hooks/
│   │   │   │   ├── checklist.api.ts
│   │   │   │   ├── checklist.types.ts
│   │   │   │   └── checklist.test.ts
│   │   │
│   │   ├── shared/                  # 共有コンポーネント（最小限に）
│   │   │   ├── components/
│   │   │   │   ├── button.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   └── layout.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── use-api.ts
│   │   │   │   └── use-toast.ts
│   │   │   └── utils/
│   │   │
│   │   ├── types/                   # グローバル型定義
│   │   │   ├── branded.ts
│   │   │   └── api.ts
│   │   │
│   │   └── main.tsx
│   │
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
└── backend/                         # バックエンドアプリケーション
    ├── src/
    │   ├── handlers/                # Lambda ハンドラー
    │   │   ├── index.ts             # メインハンドラー
    │   │   └── router.ts            # ルーティング
    │   │
    │   ├── features/                # 機能別モジュール
    │   │   ├── documents/           # 文書管理機能
    │   │   │   ├── domain/
    │   │   │   │   ├── document.entity.ts
    │   │   │   │   ├── document-id.value.ts
    │   │   │   │   ├── document-type.value.ts
    │   │   │   │   ├── metadata.value.ts
    │   │   │   │   └── document-validator.service.ts
    │   │   │   ├── document.repository.ts
    │   │   │   ├── document.repository.dynamodb.ts
    │   │   │   ├── document.handler.ts
    │   │   │   ├── s3.adapter.ts
    │   │   │   └── __tests__/
    │   │   │       ├── document.entity.test.ts
    │   │   │       ├── document-id.value.test.ts
    │   │   │       └── document.handler.test.ts
    │   │   │
    │   │   ├── checklists/          # チェックリスト機能
    │   │   │   ├── domain/
    │   │   │   │   ├── checklist.entity.ts
    │   │   │   │   ├── checklist-id.value.ts
    │   │   │   │   ├── check-item.value.ts
    │   │   │   │   ├── requirement.value.ts
    │   │   │   │   └── checklist-validator.service.ts
    │   │   │   ├── checklist.repository.ts
    │   │   │   ├── checklist.repository.dynamodb.ts
    │   │   │   ├── checklist.handler.ts
    │   │   │   └── __tests__/
    │   │   │       ├── checklist.entity.test.ts
    │   │   │       ├── check-item.value.test.ts
    │   │   │       └── checklist.handler.test.ts
    │   │   │
    │   │   ├── analysis/            # 分析機能
    │   │   └── users/               # ユーザー管理機能
    │   │
    │   ├── shared/                  # 共有ユーティリティ（最小限に）
    │   │   ├── errors/
    │   │   │   ├── application-error.ts
    │   │   │   ├── validation-error.ts
    │   │   │   └── not-found-error.ts
    │   │   ├── result.ts            # Result型
    │   │   └── validation.ts        # 基本バリデーション関数
    │   │
    │   └── types/                   # 共有型定義
    │       ├── branded.ts           # ブランド型定義
    │       └── common.ts            # 共通型
```

## 5. 実装手順

1. **型設計**

   - まず型を定義
   - ドメインの言語を型で表現

2. **純粋関数から実装**

   - 外部依存のない関数を先に
   - テストを先に書く

3. **副作用を分離**

   - IO 操作は関数の境界に押し出す
   - 副作用を持つ処理を Promise でラップ

4. **アダプター実装**
   - 外部サービスや DB へのアクセスを抽象化
   - テスト用モックを用意

## プラクティス

- 小さく始めて段階的に拡張
- 過度な抽象化を避ける
- コードよりも型を重視
- 複雑さに応じてアプローチを調整

## コードスタイル

- 関数優先（クラスは必要な場合のみ）
- 不変更新パターンの活用
- 早期リターンで条件分岐をフラット化
- エラーとユースケースの列挙型定義

## テスト戦略

- 純粋関数の単体テストを優先
- インメモリ実装によるリポジトリテスト
- テスト可能性を設計に組み込む
- アサートファースト：期待結果から逆算

## 6. AWS 統合

### 6.1 CDK によるインフラストラクチャの定義

実装する際は、自信がない場合は適宜 implementation-examples を参照してください。
