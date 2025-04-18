# 審査ワークフロー実装計画（最終版）- パート5: CDK更新とリスク対策

## 3.5. CDK スタックの更新

```typescript
// cdk/lib/beacon-stack.ts の修正部分
import { ReviewProcessor } from "./constructs/review-processor";

// 既存のコードに追加
const reviewProcessor = new ReviewProcessor(this, "ReviewProcessor", {
  documentBucket: documentBucket,
  backendLambda: backendLambda,
  logLevel: sfn.LogLevel.ALL,
});

// 環境変数の設定
backendLambda.addEnvironment(
  "REVIEW_PROCESSING_STATE_MACHINE_ARN",
  reviewProcessor.stateMachine.stateMachineArn
);

// 出力の追加
new cdk.CfnOutput(this, "ReviewProcessingStateMachineArn", {
  value: reviewProcessor.stateMachine.stateMachineArn,
  description: "Review Processing State Machine ARN",
});
```

## 4. リスクと対策

### 4.1. Bedrock API の呼び出し制限によるエラー

**対策**:
- 指数バックオフ戦略を用いたリトライロジックの実装
- エラーハンドリングの強化
- Map 状態の maxConcurrency 設定による並列実行数の制限（10に設定）

### 4.2. 大量のチェックリスト項目による処理時間の長期化

**対策**:
- Step Functions の Map 状態を使用した並列処理
- タイムアウト設定の調整（2時間に設定）

### 4.3. JSONパース失敗によるエラー

**対策**:
- プロンプトで明示的にJSON形式のみを要求
- JSONパース失敗時のリトライ処理の実装
- エラーハンドリングの強化

## 5. まとめ

この実装計画では、審査ジョブの作成時に Step Functions を使用して審査処理を実行するワークフローを実装します。Map 状態を使用してチェックリスト項目を並列処理し、効率的に審査を行います。既存の API リポジトリを活用して審査結果を RDB に格納します。

実装は段階的に進め、各フェーズでテストを行いながら進めることで、品質を確保します。また、親子関係のある審査結果を適切に処理し、Bedrock Claude 3.7 Sonnet モデルを使用して高精度な審査を実現します。

## 6. 実装スケジュール

1. **フェーズ 1: 基本構造の実装** (1日)
   - CDK 定義ファイルの作成
   - Lambda ハンドラーの基本実装

2. **フェーズ 2: 審査処理の実装** (2日)
   - 審査準備関数の実装
   - 審査項目処理関数の実装
   - 審査結果集計関数の実装

3. **フェーズ 3: テストと統合** (1日)
   - CDK スタックの更新
   - 統合テスト
   - エラーハンドリングの強化

## 7. フィードバックへの対応

1. **エラーハンドリング**: ジョブステータスを FAILED に更新するよう実装
2. **トランザクション処理**: 複数の審査結果作成を一つのトランザクションで処理
3. **既存リポジトリの活用**: ReviewJobRepository と ReviewResultRepository を使用
4. **親子関係の結果集計**: 子項目の結果に基づいて親項目の結果を更新
5. **JSON出力の強制**: プロンプトで JSON「以外」の出力を禁止し、例示を追加
6. **ファイル形式チェック**: 現状 PDF のみサポートするよう実装
7. **リトライ処理**: JSON パース失敗時のリトライ処理を実装
