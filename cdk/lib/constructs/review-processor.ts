import * as cdk from "aws-cdk-lib";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";
import * as logs from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";
import { Duration } from "aws-cdk-lib";

export interface ReviewProcessorProps {
  documentBucket: s3.IBucket;
  backendLambda: lambda.Function;
  logLevel?: sfn.LogLevel;
}

export class ReviewProcessor extends Construct {
  public readonly stateMachine: sfn.StateMachine;
  public readonly backendLambda: lambda.Function;

  constructor(scope: Construct, id: string, props: ReviewProcessorProps) {
    super(scope, id);

    // Stack側から渡されたバックエンドLambda関数を使用
    this.backendLambda = props.backendLambda;
    const logLevel = props.logLevel || sfn.LogLevel.ERROR;

    // 審査準備Lambda - チェックリスト項目を取得し、処理項目を準備
    const prepareReviewTask = new tasks.LambdaInvoke(this, "PrepareReview", {
      lambdaFunction: this.backendLambda,
      payload: sfn.TaskInput.fromObject({
        action: "prepareReview",
        reviewJobId: sfn.JsonPath.stringAt("$.reviewJobId"),
        documentId: sfn.JsonPath.stringAt("$.documentId"),
        fileName: sfn.JsonPath.stringAt("$.fileName"),
      }),
      resultPath: "$.prepareResult",
    });

    // 個別のチェックリスト項目を処理するLambda
    const processReviewItemTask = new tasks.LambdaInvoke(
      this,
      "ProcessReviewItem",
      {
        lambdaFunction: this.backendLambda,
        payload: sfn.TaskInput.fromObject({
          action: "processReviewItem",
          reviewJobId: sfn.JsonPath.stringAt("$.reviewJobId"),
          documentId: sfn.JsonPath.stringAt("$.documentId"),
          fileName: sfn.JsonPath.stringAt("$.fileName"),
          checkId: sfn.JsonPath.stringAt("$$.Map.Item.Value.checkId"),
          reviewResultId: sfn.JsonPath.stringAt(
            "$$.Map.Item.Value.reviewResultId"
          ),
        }),
        resultPath: "$.itemResult",
      }
    );

    // Map状態 - チェックリスト項目を並列処理
    const processItemsMap = new sfn.Map(this, "ProcessAllItems", {
      maxConcurrency: 10, // 並列実行数
      itemsPath: sfn.JsonPath.stringAt("$.prepareResult.Payload.checkItems"),
      resultPath: "$.processedItems",
      parameters: {
        "reviewJobId.$": "$.reviewJobId",
        "documentId.$": "$.documentId",
        "fileName.$": "$.fileName",
        "checkId.$": "$$.Map.Item.Value.checkId",
        "reviewResultId.$": "$$.Map.Item.Value.reviewResultId",
      },
    });
    processItemsMap.iterator(processReviewItemTask);

    // 審査結果を集計するLambda
    const finalizeReviewTask = new tasks.LambdaInvoke(this, "FinalizeReview", {
      lambdaFunction: this.backendLambda,
      payload: sfn.TaskInput.fromObject({
        action: "finalizeReview",
        reviewJobId: sfn.JsonPath.stringAt("$.reviewJobId"),
        processedItems: sfn.JsonPath.stringAt("$.processedItems"),
      }),
      outputPath: "$.Payload",
    });

    // エラーハンドリングLambda
    const handleErrorTask = new tasks.LambdaInvoke(this, "HandleError", {
      lambdaFunction: this.backendLambda,
      payload: sfn.TaskInput.fromObject({
        action: "handleReviewError",
        reviewJobId: sfn.JsonPath.stringAt("$.reviewJobId"),
        error: sfn.JsonPath.stringAt("$.error"),
      }),
      outputPath: "$.Payload",
    });

    // エラーハンドリングの設定
    prepareReviewTask.addCatch(handleErrorTask);
    processItemsMap.addCatch(handleErrorTask);
    finalizeReviewTask.addCatch(handleErrorTask);

    // ワークフロー定義
    const definition = prepareReviewTask
      .next(processItemsMap)
      .next(finalizeReviewTask);

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
        actions: ["bedrock:InvokeModel"],
        resources: ["*"],
      })
    );

    // S3バケットへのアクセス権限を追加
    props.documentBucket.grantReadWrite(stateMachineRole);

    // ログ設定
    const logGroup = new logs.LogGroup(this, "StateMachineLogGroup", {
      retention: logs.RetentionDays.ONE_WEEK,
    });

    // ステートマシンの作成
    this.stateMachine = new sfn.StateMachine(this, "ReviewProcessingWorkflow", {
      definitionBody: sfn.DefinitionBody.fromChainable(definition),
      role: stateMachineRole,
      timeout: Duration.hours(2),
      tracingEnabled: true,
      logs: {
        destination: logGroup,
        level: logLevel,
        includeExecutionData: true,
      },
    });
  }
}
