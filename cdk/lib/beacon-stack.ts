import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import { Construct } from "constructs";
import { DocumentPageProcessor } from "./constructs/document-page-processor";

export class BeaconStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3バケットの作成
    const documentBucket = new s3.Bucket(this, "DocumentBucket", {
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      lifecycleRules: [
        {
          id: "DeleteTempFiles",
          prefix: "pages/",
          expiration: cdk.Duration.days(7),
        },
        {
          id: "DeleteProcessedResults",
          prefix: "llm-results/",
          expiration: cdk.Duration.days(30),
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
  }
}
