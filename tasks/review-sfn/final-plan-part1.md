# 審査ワークフロー実装計画（最終版）- パート1: 概要

## 概要

審査ジョブの作成時に、Step Functions を使用して審査処理を実行するワークフローを実装します。このワークフローは、チェックリスト項目と審査対象ドキュメントを照合し、審査結果を生成します。

## 実装方針

1. 審査ワークフロー用の Step Functions を CDK で定義（Map 状態を使用して並列処理）
2. 審査処理を行う Lambda 関数を実装（既存リポジトリを活用）
3. 親子関係のある審査結果を適切に処理
4. Bedrock Claude 3.7 Sonnet モデルを使用した審査処理の実装

## 詳細計画

### 1. 新規作成するファイル

#### 1.1. CDK 定義ファイル

- **`cdk/lib/constructs/review-processor.ts`**
  - 審査ワークフロー用の Step Functions を定義
  - Map 状態を使用して子項目を並列処理

#### 1.2. Lambda 処理ファイル

- **`backend/src/review-workflow/index.ts`**
  - Lambda ハンドラー関数を定義
  - 各アクションタイプに応じた処理を振り分け

- **`backend/src/review-workflow/review-processing/index.ts`**
  - 審査処理のメイン関数を実装
  - チェックリスト項目の取得と処理項目の準備

- **`backend/src/review-workflow/review-processing/review-item-processor.ts`**
  - 個別のチェックリスト項目を処理する関数を実装
  - LLM を使用して審査を実行

### 2. 修正するファイル

- **`cdk/lib/beacon-stack.ts`**
  - 新しい Step Functions を CDK スタックに追加
  - 環境変数として Lambda に渡す

## 実装スケジュール

1. **フェーズ 1: 基本構造の実装**
   - CDK 定義ファイルの作成
   - Lambda ハンドラーの基本実装

2. **フェーズ 2: 審査処理の実装**
   - 審査準備関数の実装
   - 審査項目処理関数の実装
   - 審査結果集計関数の実装

3. **フェーズ 3: テストと統合**
   - CDK スタックの更新
   - 統合テスト

## 新規作成するファイル一覧

1. `cdk/lib/constructs/review-processor.ts`
2. `backend/src/review-workflow/index.ts`
3. `backend/src/review-workflow/review-processing/index.ts`
4. `backend/src/review-workflow/review-processing/review-item-processor.ts`

## 修正するファイル一覧

1. `cdk/lib/beacon-stack.ts`
