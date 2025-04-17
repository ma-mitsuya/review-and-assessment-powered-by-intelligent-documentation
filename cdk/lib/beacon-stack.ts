import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as path from "path";
import { Duration } from "aws-cdk-lib";
import { Construct } from "constructs";
import { DocumentPageProcessor } from "./constructs/document-page-processor";
import { S3SqsEtlAurora } from "./constructs/s3-sqs-etl-aurora";

export class BeaconStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const prefix = cdk.Stack.of(this).region;

    const accessLogBucket = new s3.Bucket(this, `${prefix}AccessLogBucket`, {
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      objectOwnership: s3.ObjectOwnership.OBJECT_WRITER,
      autoDeleteObjects: true,
    });

    // S3バケットの作成
    const documentBucket = new s3.Bucket(this, "DocumentBucket", {
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      objectOwnership: s3.ObjectOwnership.OBJECT_WRITER,
      autoDeleteObjects: true,
      serverAccessLogsBucket: accessLogBucket,
      serverAccessLogsPrefix: "DocumentBucket",
    });

    // VPCの作成
    const vpc = new ec2.Vpc(this, "BeaconVpc", {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          name: "public",
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: "private",
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: "isolated",
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 28,
        },
      ],
    });

    // バックエンドLambda関数の作成 (NodeJsFunctionを使用)
    const backendLambda = new nodejs.NodejsFunction(this, "BackendFunction", {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "handler",
      entry: path.join(
        __dirname,
        "../../backend/src/checklist-workflow/index.ts"
      ),
      timeout: Duration.minutes(15),
      memorySize: 1024,
      environment: {
        DOCUMENT_BUCKET: documentBucket.bucketName,
        BEDROCK_REGION: "us-west-2",
      },
      bundling: {
        // minify: true,
        sourceMap: true,
        externalModules: ["aws-sdk", "canvas"],
      },
    });

    // Lambda関数にS3バケットへのアクセス権限を付与
    documentBucket.grantReadWrite(backendLambda);

    // Lambda関数にBedrockへのアクセス権限を付与
    backendLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          "bedrock:InvokeModel",
          "bedrock:CreateModelInvocationJob",
          "bedrock:GetModelInvocationJob",
          "bedrock:StopModelInvocationJob",
        ],
        resources: ["*"],
      })
    );

    // ドキュメント処理ワークフローの作成
    const documentProcessor = new DocumentPageProcessor(
      this,
      "DocumentProcessor",
      {
        documentBucket,
        backendLambda,
        mediumDocThreshold: 40,
        largeDocThreshold: 100,
        inlineMapConcurrency: 10,
        distributedMapConcurrency: 20,
        logLevel: sfn.LogLevel.ALL,
      }
    );

    // バックエンドLambdaにステートマシンARNを環境変数として設定
    // -> 循環参照
    // backendLambda.addEnvironment(
    //   'DOCUMENT_PROCESSING_STATE_MACHINE_ARN',
    //   documentProcessor.stateMachine.stateMachineArn
    // );

    // // S3 -> SQS -> Lambda -> Aurora ETLパイプラインの作成
    // const etlPipeline = new S3SqsEtlAurora(this, "EtlPipeline", {
    //   documentBucket,
    //   csvPrefix: "csv/",
    //   vpc,
    //   databaseName: "beacon",
    //   minCapacity: 0.5,
    //   maxCapacity: 1,
    // });

    // 出力
    new cdk.CfnOutput(this, "DocumentBucketName", {
      value: documentBucket.bucketName,
      description: "ドキュメントを保存するS3バケット名",
    });

    new cdk.CfnOutput(this, "StateMachineArn", {
      value: documentProcessor.stateMachine.stateMachineArn,
      description: "ドキュメント処理ワークフローのARN",
    });

    new cdk.CfnOutput(this, "BackendLambdaArn", {
      value: backendLambda.functionArn,
      description: "バックエンドLambda関数のARN",
    });

    // new cdk.CfnOutput(this, "SqsQueueUrl", {
    //   value: etlPipeline.queue.queueUrl,
    //   description: "CSV処理用SQSキューのURL",
    // });

    // new cdk.CfnOutput(this, "EtlLambdaArn", {
    //   value: etlPipeline.etlLambda.functionArn,
    //   description: "ETL Lambda関数のARN",
    // });

    // new cdk.CfnOutput(this, "AuroraClusterEndpoint", {
    //   value: etlPipeline.auroraCluster.clusterEndpoint.hostname,
    //   description: "Aurora Serverless v2クラスターのエンドポイント",
    // });

    // new cdk.CfnOutput(this, "AuroraSecretArn", {
    //   value: etlPipeline.auroraCluster.secret?.secretArn || "No secret created",
    //   description: "Aurora接続情報のSecrets ManagerのARN",
    // });
  }
}
