import * as cdk from "aws-cdk-lib";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";
import * as logs from "aws-cdk-lib/aws-logs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as path from "path";
import { Construct } from "constructs";

export interface ReviewProcessorProps {
  documentBucket: s3.IBucket;
  vpc: ec2.IVpc;
  logLevel?: sfn.LogLevel;
}

export class ReviewProcessor extends Construct {
  public readonly stateMachine: sfn.StateMachine;
  public readonly reviewLambda: lambda.Function;
  public readonly securityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: ReviewProcessorProps) {
    super(scope, id);

    const logLevel = props.logLevel || sfn.LogLevel.ERROR;

    // セキュリティグループの作成
    this.securityGroup = new ec2.SecurityGroup(this, "ReviewProcessorSecurityGroup", {
      vpc: props.vpc,
      description: "Security group for Review Processor Lambda function",
      allowAllOutbound: true,
    });

    // 審査処理用Lambda関数を作成
    this.reviewLambda = new nodejs.NodejsFunction(this, "ReviewProcessorFunction", {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "handler",
      entry: path.join(__dirname, "../../../backend/src/review-workflow/index.ts"),
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [this.securityGroup],
      timeout: cdk.Duration.minutes(15),
      memorySize: 1024,
      environment: {
        DOCUMENT_BUCKET: props.documentBucket.bucketName,
        BEDROCK_REGION: "us-west-2",
      },
      bundling: {
        sourceMap: true,
        externalModules: ["aws-sdk", "canvas"],
        commandHooks: {
          beforeInstall: () => [],
          beforeBundling: () => [],
          afterBundling: () => [],
        },
      },
    });

    // Lambda関数にS3バケットへのアクセス権限を付与
    props.documentBucket.grantReadWrite(this.reviewLambda);

    // Lambda関数にBedrockへのアクセス権限を付与
    this.reviewLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["bedrock:InvokeModel"],
        resources: ["*"],
      })
    );

    // 審査準備Lambda - チェックリスト項目を取得し、処理項目を準備
    const prepareReviewTask = new tasks.LambdaInvoke(this, "PrepareReview", {
      lambdaFunction: this.reviewLambda,
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
        lambdaFunction: this.reviewLambda,
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
      lambdaFunction: this.reviewLambda,
      payload: sfn.TaskInput.fromObject({
        action: "finalizeReview",
        reviewJobId: sfn.JsonPath.stringAt("$.reviewJobId"),
        processedItems: sfn.JsonPath.stringAt("$.processedItems"),
      }),
      outputPath: "$.Payload",
    });

    // エラーハンドリングLambda
    const handleErrorTask = new tasks.LambdaInvoke(this, "HandleError", {
      lambdaFunction: this.reviewLambda,
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
      timeout: cdk.Duration.hours(2),
      tracingEnabled: true,
      logs: {
        destination: logGroup,
        level: logLevel,
        includeExecutionData: true,
      },
    });
  }
}
