# 審査ワークフロー実装計画（最終版）- 要約

## 概要

審査ジョブの作成時に、Step Functions を使用して審査処理を実行するワークフローを実装します。このワークフローは、チェックリスト項目と審査対象ドキュメントを照合し、審査結果を生成します。

## 実装方針

1. 審査ワークフロー用の Step Functions を CDK で定義（Map 状態を使用して並列処理）
2. 審査処理を行う Lambda 関数を実装（既存リポジトリを活用）
3. 親子関係のある審査結果を適切に処理
4. Bedrock Claude 3.7 Sonnet モデルを使用した審査処理の実装

## 新規作成するファイル

1. `cdk/lib/constructs/review-processor.ts`
   - 審査ワークフロー用の Step Functions を定義
   - Map 状態を使用して子項目を並列処理

2. `backend/src/review-workflow/index.ts`
   - Lambda ハンドラー関数を定義
   - 各アクションタイプに応じた処理を振り分け

3. `backend/src/review-workflow/review-processing/index.ts`
   - 審査処理のメイン関数を実装
   - チェックリスト項目の取得と処理項目の準備

4. `backend/src/review-workflow/review-processing/review-item-processor.ts`
   - 個別のチェックリスト項目を処理する関数を実装
   - LLM を使用して審査を実行

## 修正するファイル

1. `cdk/lib/beacon-stack.ts`
   - 新しい Step Functions を CDK スタックに追加
   - 環境変数として Lambda に渡す

## 主要な実装内容

### Step Functions の設計

- 3つの主要なステップで構成
  1. **PrepareReview**: チェックリスト項目を取得し、処理項目を準備
  2. **ProcessAllItems**: Map 状態でチェックリスト項目を並列処理
  3. **FinalizeReview**: 審査結果を集計し、親子関係の結果を更新

- エラーハンドリング機能を追加
- IAM ロールに適切な権限を設定
- タイムアウトを2時間に設定

### Lambda ハンドラーの実装

- 4つのアクションタイプに対応
  1. **prepareReview**: 審査準備処理
  2. **processReviewItem**: 個別の審査項目処理
  3. **finalizeReview**: 審査結果集計処理
  4. **handleReviewError**: エラーハンドリング処理

### 審査処理の実装

- **prepareReview**: 
  - 親項目のみを抽出
  - トランザクションで一括処理
  - ジョブステータスを更新

- **finalizeReview**:
  - 親子関係のマッピングを作成
  - 子項目の結果に基づいて親項目の結果を更新
  - ジョブステータスを完了に更新

### 審査項目処理の実装

- Bedrock Claude 3.7 Sonnet モデルを使用
- JSON形式のみを出力するようプロンプトを設計
- JSONパース失敗時のリトライ処理を実装
- 現状PDFのみサポート

## リスク対策

1. **Bedrock API の呼び出し制限によるエラー**
   - 並列実行数の制限（maxConcurrency: 10）
   - エラーハンドリングの強化

2. **大量のチェックリスト項目による処理時間の長期化**
   - Map 状態を使用した並列処理
   - タイムアウト設定の調整（2時間）

3. **JSONパース失敗によるエラー**
   - プロンプトで明示的にJSON形式のみを要求
   - リトライ処理の実装

## 実装スケジュール

1. **フェーズ 1: 基本構造の実装** (1日)
2. **フェーズ 2: 審査処理の実装** (2日)
3. **フェーズ 3: テストと統合** (1日)

## フィードバックへの対応

1. エラーハンドリング: ジョブステータスを FAILED に更新
2. トランザクション処理: 複数の審査結果作成を一つのトランザクションで処理
3. 既存リポジトリの活用: ReviewJobRepository と ReviewResultRepository を使用
4. 親子関係の結果集計: 子項目の結果に基づいて親項目の結果を更新
5. JSON出力の強制: プロンプトで JSON「以外」の出力を禁止し、例示を追加
6. ファイル形式チェック: 現状 PDF のみサポート
7. リトライ処理: JSON パース失敗時のリトライ処理を実装
