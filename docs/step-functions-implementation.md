# BEACON処理フローのStep Functions実装

このドキュメントでは、BEACONの処理フローをAWS Step Functionsを使用して実装する方法について説明します。

## 目次

1. [概要](#概要)
2. [アーキテクチャ](#アーキテクチャ)
3. [並行処理の選択](#並行処理の選択)
4. [Step Functions実装](#step-functions実装)
5. [スロットリング対策](#スロットリング対策)
6. [モニタリングとアラート](#モニタリングとアラート)
7. [考慮事項](#考慮事項)

## 概要

BEACONの処理フローは、ドキュメントのアップロードから構造化されたレポート生成までの一連のステップを含みます。この処理フローをAWS Step Functionsを使用してオーケストレーションすることで、以下の利点が得られます：

- 処理の可視化と監視
- エラー処理とリトライの自動化
- 並行処理の制御
- サーバーレスアーキテクチャの実現

## アーキテクチャ

BEACONの処理フローをStep Functionsで実装する際のアーキテクチャは以下の通りです：

```
┌───────────────────┐
│ Step Functions    │
│ ステートマシン     │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐      ┌───────────────────┐
│ ドキュメント処理   │      │ S3バケット        │
│ Lambda            │◄────►│ (beacon-documents)│
└─────────┬─────────┘      └───────────────────┘
          │
          ▼
┌───────────────────┐
│ Map State         │
│ (並行処理)        │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐      ┌───────────────────┐
│ LLM処理 Lambda    │◄────►│ Amazon Bedrock    │
└─────────┬─────────┘      └───────────────────┘
          │
          ▼
┌───────────────────┐
│ 結果統合 Lambda   │
└───────────────────┘
```

## 並行処理の選択

BEACONの処理フローでは、各ページ/シートの並行処理が必要です。この並行処理を実装するために、以下の2つの選択肢があります：

### 1. Step Functions Map State

**メリット**:
- リアルタイムな処理が可能
- 詳細な進捗管理と可視化
- 柔軟なエラーハンドリング

**デメリット**:
- スロットリング制御が必要
- インラインモードでは最大40の並行実行に制限
- 分散モードでは設定が複雑

### 2. Amazon Bedrock Batch Inference

**メリット**:
- コストが50%安い
- スロットリング管理が不要
- 大規模データセットに最適化

**デメリット**:
- 非同期処理のため、リアルタイム性が低い
- 最小100レコード必要
- ジョブ単位の制限あり

### 推奨アプローチ: ハイブリッド方式

ドキュメントのサイズと処理要件に応じて、以下のハイブリッドアプローチを推奨します：

1. 少量のページ（40ページ以下）: **Map State（インラインモード）**
2. 中量のページ（41-100ページ）: **Map State（分散モード）**
3. 大量のページ（100ページ以上）: **Bedrock Batch Inference**

この選択ロジックをStep Functionsのワークフローに組み込むことで、最適な処理方法を自動的に選択できます。

## スロットリング対策

Amazon Bedrockは、APIリクエストに対してスロットリング（レート制限）を適用しています。特に、Claude 3 Opusなどの高性能モデルでは、デフォルトのクォータが低く設定されている場合があります。以下に、スロットリングに対処するための戦略を示します：

### 1. 指数バックオフリトライ

Lambda関数内でBedrockを呼び出す際に、スロットリングエラーを検出して指数バックオフでリトライする機能を実装します：

```typescript
// backend/src/utils/retry.ts
export async function exponentialBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts: number;
    baseDelay: number;
    maxDelay: number;
    shouldRetry: (error: any) => boolean;
  }
): Promise<T> {
  let attempt = 0;
  
  while (attempt < options.maxAttempts) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      
      if (attempt === options.maxAttempts || !options.shouldRetry(error)) {
        throw error;
      }

      const delay = Math.min(
        options.baseDelay * Math.pow(2, attempt),
        options.maxDelay
      );
      
      console.log(`リトライ ${attempt}/${options.maxAttempts}, ${delay}ms後に再試行します`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error('最大リトライ回数を超えました');
}

// backend/src/handlers/llm-processor.ts
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';
import { exponentialBackoff } from '../utils/retry';

export const handler = async (event: any) => {
  const bedrock = new BedrockRuntimeClient({ 
    region: process.env.AWS_REGION,
  });

  try {
    // リトライ付きのLLM呼び出し
    const result = await exponentialBackoff(
      async () => {
        return await bedrock.invokeModel({
          modelId: process.env.BEDROCK_MODEL_ID,
          contentType: 'application/json',
          accept: 'application/json',
          body: JSON.stringify({
            prompt: event.prompt,
            max_tokens: 2048,
          })
        });
      },
      {
        maxAttempts: 5,
        baseDelay: 1000,
        maxDelay: 10000,
        shouldRetry: (error: any) => {
          return error.name === 'ThrottlingException';
        }
      }
    );

    return {
      statusCode: 200,
      body: result
    };

  } catch (error) {
    console.error('ページ処理中にエラーが発生しました:', error);
    throw error;
  }
};
```

### 2. Step Functions Map Stateの並行制御

Map Stateの`maxConcurrency`パラメータを使用して、同時に実行されるタスクの数を制限します：

```typescript
const mapConfig: sfn.MapProps = {
  maxConcurrency: 10, // Bedrockのクォータに合わせて調整
  itemsPath: sfn.JsonPath.stringAt('$.pages'),
  // 他の設定...
};
```

### 3. レート制限トークンバケット

より高度なレート制限が必要な場合は、DynamoDBを使用したトークンバケットアルゴリズムを実装できます：

```typescript
// backend/src/utils/rate-limiter.ts
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';

export class RateLimiter {
  private ddbClient: DynamoDBDocument;
  private tableName: string;
  private modelId: string;
  private tokensPerMinute: number;

  constructor(modelId: string, tokensPerMinute: number, tableName: string) {
    const client = new DynamoDBClient({});
    this.ddbClient = DynamoDBDocument.from(client);
    this.tableName = tableName;
    this.modelId = modelId;
    this.tokensPerMinute = tokensPerMinute;
  }

  async acquireToken(): Promise<boolean> {
    const now = Date.now();
    const minute = Math.floor(now / 60000);
    
    try {
      const result = await this.ddbClient.update({
        TableName: this.tableName,
        Key: {
          modelId: this.modelId,
          minute: minute
        },
        UpdateExpression: 'ADD tokens :inc',
        ConditionExpression: 'attribute_not_exists(tokens) OR tokens < :limit',
        ExpressionAttributeValues: {
          ':inc': 1,
          ':limit': this.tokensPerMinute
        },
        ReturnValues: 'UPDATED_NEW'
      });
      
      return true;
    } catch (error) {
      if (error.name === 'ConditionalCheckFailedException') {
        return false; // レート制限に達した
      }
      throw error;
    }
  }
}
```

### 4. クォータ増加リクエスト

本番環境では、AWS Service Quotasを通じてBedrockのクォータ増加をリクエストすることを検討してください：

1. AWS Management Consoleにログイン
2. Service Quotasサービスに移動
3. Amazon Bedrockを選択
4. 適切なクォータを選択し、増加をリクエスト

### 5. Provisioned Throughputの使用

重要なワークロードでは、Amazon Bedrock Provisioned Throughputを使用して、専用のモデル容量を確保することを検討してください：

```typescript
// CDKでのProvisioned Throughputの設定例
import * as bedrock from 'aws-cdk-lib/aws-bedrock';

const provisionedThroughput = new bedrock.CfnProvisionedModel(this, 'BeaconProvisionedModel', {
  modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
  provisionedModelName: 'beacon-provisioned-model',
  modelUnits: 1, // 必要に応じて調整
});
```

## モニタリングとアラート

処理フローの監視とアラートを設定することで、問題を早期に検出し対応することができます：

```typescript
// cdk/lib/monitoring-stack.ts
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as actions from 'aws-cdk-lib/aws-cloudwatch-actions';

export class BeaconMonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // スロットリングアラート
    const throttlingAlarm = new cloudwatch.Alarm(this, 'ThrottlingAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/States',
        metricName: 'ExecutionThrottled',
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 10,
      evaluationPeriods: 1,
      alarmDescription: 'Step Functions実行のスロットリングを検出しました',
    });

    // 処理時間アラート
    const processingTimeAlarm = new cloudwatch.Alarm(this, 'ProcessingTimeAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/States',
        metricName: 'ExecutionTime',
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 300, // 5分
      evaluationPeriods: 1,
      alarmDescription: 'Step Functions実行に時間がかかっています',
    });

    // エラーアラート
    const errorAlarm = new cloudwatch.Alarm(this, 'ErrorAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/States',
        metricName: 'ExecutionsFailed',
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      alarmDescription: 'Step Functions実行が失敗しました',
    });

    // SNSトピック
    const alarmTopic = new sns.Topic(this, 'AlarmTopic');
    throttlingAlarm.addAlarmAction(new actions.SnsAction(alarmTopic));
    processingTimeAlarm.addAlarmAction(new actions.SnsAction(alarmTopic));
    errorAlarm.addAlarmAction(new actions.SnsAction(alarmTopic));
  }
}
```

## 考慮事項

### 1. コスト最適化

- 大量のドキュメント処理にはBatch Inferenceを使用（50%のコスト削減）
- 処理済みの中間ファイルにS3ライフサイクルポリシーを適用
- 適切なLambdaメモリサイズの選択

### 2. スケーラビリティ

- 分散Map Stateを使用して大規模な並行処理を実現
- DynamoDBを使用したレート制限の実装
- 必要に応じてProvisioned Throughputを使用

### 3. 信頼性

- 複数レベルのリトライ機構
- エラー処理とリカバリの自動化
- 詳細なログ記録とモニタリング

### 4. セキュリティ

- 最小権限の原則に基づくIAMポリシー
- S3バケットの暗号化
- VPC内でのリソース実行（必要に応じて）

### 5. 運用効率

- CloudWatchダッシュボードによる可視化
- 自動アラートの設定
- 処理状態の追跡と監視

### 6. パフォーマンス

- 適切な並行処理レベルの選択
- スロットリング対策の実装
- キャッシュ戦略の活用
