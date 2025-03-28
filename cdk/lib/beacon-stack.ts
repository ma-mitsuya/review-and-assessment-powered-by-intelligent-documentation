import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import { DocumentPageProcessor } from "./constructs/document-page-processor";
import { S3SqsEtlAurora } from "./constructs/s3-sqs-etl-aurora";

export class BeaconStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3バケットの作成
    const documentBucket = new s3.Bucket(this, "DocumentBucket", {
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      // lifecycleRules: [
      //   {
      //     id: "DeleteTempFiles",
      //     prefix: "pages/",
      //     expiration: cdk.Duration.days(7),
      //   },
      //   {
      //     id: "DeleteProcessedResults",
      //     prefix: "llm-results/",
      //     expiration: cdk.Duration.days(30),
      //   },
      // ],
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

    // ドキュメント処理ワークフローの作成
    const documentProcessor = new DocumentPageProcessor(
      this,
      "DocumentProcessor",
      {
        documentBucket,
        mediumDocThreshold: 40,
        largeDocThreshold: 100,
        inlineMapConcurrency: 10,
        distributedMapConcurrency: 20,
        logLevel: sfn.LogLevel.ALL,
      }
    );

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
      value: documentProcessor.backendLambda.functionArn,
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
