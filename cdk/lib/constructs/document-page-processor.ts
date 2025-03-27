import * as cdk from "aws-cdk-lib";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";
import * as logs from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";
import { Duration } from "aws-cdk-lib";

/**
 * ドキュメント処理ワークフローのプロパティ
 */
export interface DocumentPageProcessorProps {
  /**
   * ドキュメントを保存するS3バケット
   */
  documentBucket: s3.IBucket;

  /**
   * 中規模ドキュメントのしきい値（ページ数）
   * このページ数以上の場合は分散Map Stateを使用
   * @default 40
   */
  mediumDocThreshold?: number;

  /**
   * 大規模ドキュメントのしきい値（ページ数）
   * このページ数以上の場合はBatch APIを使用
   * @default 100
   */
  largeDocThreshold?: number;

  /**
   * インラインMap Stateの最大並行実行数
   * @default 10
   */
  inlineMapConcurrency?: number;

  /**
   * 分散Map Stateの最大並行実行数
   * @default 20
   */
  distributedMapConcurrency?: number;

  /**
   * ステートマシンの実行ログレベル
   * @default ERROR
   */
  logLevel?: sfn.LogLevel;
}

/**
 * ドキュメント処理ワークフローを実装するCDK Construct
 */
export class DocumentPageProcessor extends Construct {
  /**
   * ステートマシン
   */
  public readonly stateMachine: sfn.StateMachine;

  /**
   * バックエンドLambda関数
   */
  public readonly backendLambda: lambda.Function;

  constructor(scope: Construct, id: string, props: DocumentPageProcessorProps) {
    super(scope, id);

    // デフォルト値の設定
    const mediumDocThreshold = props.mediumDocThreshold || 40;
    const largeDocThreshold = props.largeDocThreshold || 100;
    const inlineMapConcurrency = props.inlineMapConcurrency || 10;
    const distributedMapConcurrency = props.distributedMapConcurrency || 20;
    const logLevel = props.logLevel || sfn.LogLevel.ERROR;

    // バックエンドLambda関数の作成
    this.backendLambda = new lambda.Function(this, "BackendFunction", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "handlers/index.handler",
      code: lambda.Code.fromAsset("../backend/dist"),
      timeout: Duration.minutes(15),
      memorySize: 1024,
      environment: {
        DOCUMENT_BUCKET: props.documentBucket.bucketName,
      },
    });

    // Lambda関数にS3バケットへのアクセス権限を付与
    props.documentBucket.grantReadWrite(this.backendLambda);

    // Lambda関数にBedrockへのアクセス権限を付与
    this.backendLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          "bedrock:InvokeModel",
          "bedrock:CreateModelInvocationJob",
          "bedrock:GetModelInvocationJob",
          "bedrock:StopModelInvocationJob",
        ],
        resources: [
          `arn:aws:bedrock:${cdk.Stack.of(this).region}::foundation-model/*`,
        ],
      })
    );

    // ドキュメント処理Lambda (ファイル形式判定、ページ分割など)
    const documentProcessorTask = new tasks.LambdaInvoke(
      this,
      "ProcessDocument",
      {
        lambdaFunction: this.backendLambda,
        payload: sfn.TaskInput.fromObject({
          action: "processDocument",
          documentId: sfn.JsonPath.stringAt("$.documentId"),
          fileName: sfn.JsonPath.stringAt("$.fileName"),
          fileType: sfn.JsonPath.stringAt("$.fileType"),
        }),
        outputPath: "$.Payload",
      }
    );

    // テキスト抽出用のLambda Invoke Task
    const extractTextTask = new tasks.LambdaInvoke(this, "ExtractText", {
      lambdaFunction: this.backendLambda,
      payload: sfn.TaskInput.fromObject({
        action: "extractText",
        documentId: sfn.JsonPath.stringAt("$.documentId"),
        pageNumber: sfn.JsonPath.stringAt("$.pageNumber"),
      }),
      resultPath: "$.textExtraction",
      outputPath: "$",
    });

    // LLM処理用のLambda Invoke Task
    const processWithLLMTask = new tasks.LambdaInvoke(this, "ProcessWithLLM", {
      lambdaFunction: this.backendLambda,
      payload: sfn.TaskInput.fromObject({
        action: "processWithLLM",
        documentId: sfn.JsonPath.stringAt("$.documentId"),
        pageNumber: sfn.JsonPath.stringAt("$.pageNumber"),
      }),
      resultPath: "$.llmProcessing",
      outputPath: "$",
    }).addRetry({
      errors: [
        "Lambda.ServiceException",
        "Lambda.AWSLambdaException",
        "Lambda.SdkClientException",
      ],
      interval: Duration.seconds(2),
      backoffRate: 2,
      maxAttempts: 5,
    });

    // 結果を結合するLambda Invoke Task
    const combinePageResultsTask = new tasks.LambdaInvoke(
      this,
      "CombinePageResults",
      {
        lambdaFunction: this.backendLambda,
        payload: sfn.TaskInput.fromObject({
          action: "combinePageResults",
          documentId: sfn.JsonPath.stringAt("$.documentId"),
          pageNumber: sfn.JsonPath.stringAt("$.pageNumber"),
        }),
        outputPath: "$.Payload",
      }
    );

    // エラーハンドリングLambda
    const handleErrorTask = new tasks.LambdaInvoke(this, "HandleError", {
      lambdaFunction: this.backendLambda,
      payload: sfn.TaskInput.fromObject({
        action: "handleError",
        documentId: sfn.JsonPath.stringAt("$.documentId"),
        error: sfn.JsonPath.stringAt("$.error"),
      }),
      outputPath: "$.Payload",
    });

    // パラレル処理エラーハンドリングLambda
    const handleParallelErrorTask = new tasks.LambdaInvoke(
      this,
      "HandleParallelError",
      {
        lambdaFunction: this.backendLambda,
        payload: sfn.TaskInput.fromObject({
          action: "handleError",
          documentId: sfn.JsonPath.stringAt("$.documentId"),
          pageNumber: sfn.JsonPath.stringAt("$.pageNumber"),
          error: sfn.JsonPath.stringAt("$.error"),
        }),
        outputPath: "$.Payload",
      }
    );

    // パラレル状態の定義
    const parallelProcessing = new sfn.Parallel(this, "ParallelProcessing", {
      resultPath: "$",
      outputPath: "$",
    })
      .branch(extractTextTask)
      .branch(processWithLLMTask);

    // エラーハンドリング
    parallelProcessing.addCatch(handleParallelErrorTask);

    // 各ページの処理フロー: パラレル処理 -> 結果結合
    const processPageFlow = parallelProcessing.next(combinePageResultsTask);

    // インラインMap State
    const inlineMapState = new sfn.Map(this, "ProcessAllPagesInline", {
      maxConcurrency: inlineMapConcurrency,
      itemsPath: sfn.JsonPath.stringAt("$.pages"),
      resultPath: "$.processedPages",
      itemSelector: {
        pageNumber: sfn.JsonPath.stringAt("$$.Map.Item.Value.pageNumber"),
        documentId: sfn.JsonPath.stringAt("$.documentId"),
        fileType: sfn.JsonPath.stringAt("$.metadata.fileType"),
      },
    });
    inlineMapState.itemProcessor(processPageFlow);

    // 中規模ドキュメント処理用のPass State
    const processMediumDocPass = new sfn.Pass(this, "ProcessMediumDocPass", {
      parameters: {
        status: "Processing medium document with distributed map (simplified)",
        documentId: sfn.JsonPath.stringAt("$.documentId"),
        processedPages: [],
      },
      resultPath: "$.processedPages",
    });

    // 大規模ドキュメント処理用のPass State
    const processLargeDocPass = new sfn.Pass(this, "ProcessLargeDocPass", {
      parameters: {
        status: "Processing large document with Bedrock Batch (simplified)",
        documentId: sfn.JsonPath.stringAt("$.documentId"),
        processedPages: [],
      },
      resultPath: "$.processedPages",
    });

    // 結果統合Lambda
    const aggregateResultTask = new tasks.LambdaInvoke(
      this,
      "AggregateResults",
      {
        lambdaFunction: this.backendLambda,
        payload: sfn.TaskInput.fromObject({
          action: "aggregatePageResults",
          documentId: sfn.JsonPath.stringAt("$.documentId"),
          processedPages: sfn.JsonPath.stringAt("$.processedPages"),
        }),
        outputPath: "$.Payload",
      }
    );

    // ページ数に基づく処理方法の選択
    const pageCountChoice = new sfn.Choice(this, "CheckPageCount")
      .when(
        sfn.Condition.numberGreaterThanEquals("$.pageCount", largeDocThreshold),
        processLargeDocPass
      )
      .when(
        sfn.Condition.numberGreaterThanEquals(
          "$.pageCount",
          mediumDocThreshold
        ),
        processMediumDocPass
      )
      .otherwise(inlineMapState);

    // ワークフロー定義
    const definition = documentProcessorTask.next(pageCountChoice);

    // 各処理パスから結合タスクへの接続
    inlineMapState.next(aggregateResultTask);
    processMediumDocPass.next(aggregateResultTask);
    processLargeDocPass.next(aggregateResultTask);

    // IAMロールの作成
    const stateMachineRole = new iam.Role(this, "StateMachineRole", {
      assumedBy: new iam.ServicePrincipal("states.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaRole"
        ),
      ],
    });

    // Bedrockへのアクセス権限を追加
    stateMachineRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          "bedrock:InvokeModel",
          "bedrock:CreateModelInvocationJob",
          "bedrock:GetModelInvocationJob",
          "bedrock:StopModelInvocationJob",
        ],
        resources: [
          `arn:aws:bedrock:${cdk.Stack.of(this).region}::foundation-model/*`,
        ],
      })
    );

    // S3バケットへのアクセス権限を追加
    props.documentBucket.grantReadWrite(stateMachineRole);

    // ログ設定
    const logGroup = new logs.LogGroup(this, "StateMachineLogGroup", {
      retention: logs.RetentionDays.ONE_WEEK,
    });

    // ステートマシンの作成
    this.stateMachine = new sfn.StateMachine(
      this,
      "DocumentProcessingWorkflow",
      {
        definition,
        role: stateMachineRole,
        timeout: Duration.hours(24),
        tracingEnabled: true,
        logs: {
          destination: logGroup,
          level: logLevel,
          includeExecutionData: true,
        },
      }
    );

    // エラーハンドリングの設定
    documentProcessorTask.addCatch(handleErrorTask);
    aggregateResultTask.addCatch(handleErrorTask);
  }
}
