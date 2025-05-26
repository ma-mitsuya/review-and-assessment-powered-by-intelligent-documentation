import * as cdk from "aws-cdk-lib";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";
import * as logs from "aws-cdk-lib/aws-logs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as path from "path";
import { Construct } from "constructs";
import { DockerPrismaFunction } from "./docker-prisma-function";
import { Platform } from "aws-cdk-lib/aws-ecr-assets";
import { DatabaseConnectionProps } from "./database";
export interface ReviewProcessorProps {
  documentBucket: s3.IBucket;
  vpc: ec2.IVpc;
  databaseConnection: DatabaseConnectionProps;
  logLevel?: sfn.LogLevel;
  maxConcurrency?: number; // Add parameter for controlling parallel executions
}

export class ReviewProcessor extends Construct {
  public readonly stateMachine: sfn.StateMachine;
  public readonly reviewLambda: lambda.Function;
  public readonly securityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: ReviewProcessorProps) {
    super(scope, id);

    const logLevel = props.logLevel || sfn.LogLevel.ERROR;
    const maxConcurrency = props.maxConcurrency || 1; // Default to 1 for throttling avoidance

    // セキュリティグループの作成
    this.securityGroup = new ec2.SecurityGroup(
      this,
      "ReviewProcessorSecurityGroup",
      {
        vpc: props.vpc,
        description: "Security group for Review Processor Lambda function",
        allowAllOutbound: true,
      }
    );

    // 審査処理用Lambda関数を作成
    this.reviewLambda = new DockerPrismaFunction(
      this,
      "DocumentProcessorFunction",
      {
        code: lambda.DockerImageCode.fromImageAsset(
          path.join(__dirname, "../../../backend/"),
          {
            file: "Dockerfile.prisma.lambda",
            platform: Platform.LINUX_AMD64,
            cmd: ["dist/review-workflow/index.handler"],
          }
        ),
        memorySize: 1024,
        timeout: cdk.Duration.minutes(15),
        vpc: props.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        environment: {
          DOCUMENT_BUCKET: props.documentBucket.bucketName,
          BEDROCK_REGION: "us-west-2",
        },
        securityGroups: [this.securityGroup],
        database: props.databaseConnection,
      }
    );

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
      }),
      resultPath: "$.prepareResult",
    });

    // Map状態 - チェックリスト項目を並列処理
    const processItemsMap = new sfn.Map(this, "ProcessAllItems", {
      maxConcurrency: maxConcurrency, // Use the parameter to control concurrency
      itemsPath: sfn.JsonPath.stringAt("$.prepareResult.Payload.checkItems"),
      resultPath: "$.processedItems",
      parameters: {
        "reviewJobId.$": "$.reviewJobId",
        "checkId.$": "$$.Map.Item.Value.checkId",
        "reviewResultId.$": "$$.Map.Item.Value.reviewResultId",
      },
    });

    // Map内で各項目を処理するLambda
    const processReviewItemTask = new tasks.LambdaInvoke(
      this,
      "ProcessReviewItem",
      {
        lambdaFunction: this.reviewLambda,
        payload: sfn.TaskInput.fromObject({
          action: "processReviewItem",
          reviewJobId: sfn.JsonPath.stringAt("$.reviewJobId"),
          checkId: sfn.JsonPath.stringAt("$.checkId"),
          reviewResultId: sfn.JsonPath.stringAt("$.reviewResultId"),
        }),
        resultPath: "$.itemResult",
      }
    );

    // Add retry configuration for throttling errors
    processReviewItemTask.addRetry({
      errors: [
        "ThrottlingException",
        "ServiceQuotaExceededException",
        "TooManyRequestsException",
      ],
      interval: cdk.Duration.seconds(2),
      maxAttempts: 5,
      backoffRate: 2,
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
        reviewJobId: sfn.JsonPath.stringAt("$$.Execution.Input.reviewJobId"),
        error: sfn.JsonPath.stringAt("$.error.Error"),
        cause: sfn.JsonPath.stringAt("$.error.Cause"),
      }),
      resultPath: "$.errorResult",
    });

    // エラーハンドリングの設定
    prepareReviewTask.addCatch(handleErrorTask, {
      errors: ["States.ALL"],
      resultPath: "$.error",
    });
    processItemsMap.addCatch(handleErrorTask, {
      errors: ["States.ALL"],
      resultPath: "$.error",
    });
    finalizeReviewTask.addCatch(handleErrorTask, {
      errors: ["States.ALL"],
      resultPath: "$.error",
    });

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
