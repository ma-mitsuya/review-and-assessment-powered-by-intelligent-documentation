import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import { DocumentPageProcessor } from "./constructs/document-page-processor";
import { ReviewProcessor } from "./constructs/review-processor";
import { Database } from "./constructs/database";
import { Api } from "./constructs/api";

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

    // データベースの作成
    const database = new Database(this, "Database", {
      vpc,
      databaseName: "beacon",
      minCapacity: 0.5,
      maxCapacity: 1,
      autoPause: true,
      autoPauseSeconds: 300,
    });

    // ドキュメント処理ワークフローの作成
    const documentProcessor = new DocumentPageProcessor(
      this,
      "DocumentProcessor",
      {
        documentBucket,
        vpc,
        mediumDocThreshold: 40,
        largeDocThreshold: 100,
        inlineMapConcurrency: 10,
        distributedMapConcurrency: 20,
        logLevel: sfn.LogLevel.ALL,
        databaseConnection: database.connection,
      }
    );

    // 審査ワークフローの作成
    const reviewProcessor = new ReviewProcessor(this, "ReviewProcessor", {
      documentBucket,
      vpc,
      logLevel: sfn.LogLevel.ALL,
      databaseConnection: database.connection,
    });

    // API Gatewayとそれに紐づくLambda関数の作成
    const api = new Api(this, "Api", {
      vpc,
      environment: {
        DATABASE_URL: `mysql://${database.secret
          .secretValueFromJson("username")
          .unsafeUnwrap()}:${database.secret
          .secretValueFromJson("password")
          .unsafeUnwrap()}@${database.cluster.clusterEndpoint.hostname}:${
          database.cluster.clusterEndpoint.port
        }/${database.secret.secretValueFromJson("dbname").unsafeUnwrap()}`,
      },
    });

    // データベース接続権限の付与
    database.grantConnect(api.securityGroup);
    database.grantSecretAccess(api.apiLambda);
    database.grantConnect(documentProcessor.securityGroup);
    database.grantSecretAccess(documentProcessor.documentLambda);
    database.grantConnect(reviewProcessor.securityGroup);
    database.grantSecretAccess(reviewProcessor.reviewLambda);

    // S3バケットアクセス権限の付与
    documentBucket.grantReadWrite(api.apiLambda);

    // 出力
    new cdk.CfnOutput(this, "DocumentBucketName", {
      value: documentBucket.bucketName,
      description: "ドキュメントを保存するS3バケット名",
    });

    new cdk.CfnOutput(this, "DocumentProcessingStateMachineArn", {
      value: documentProcessor.stateMachine.stateMachineArn,
      description: "ドキュメント処理ワークフローのARN",
    });

    new cdk.CfnOutput(this, "DocumentProcessorLambdaArn", {
      value: documentProcessor.documentLambda.functionArn,
      description: "ドキュメント処理Lambda関数のARN",
    });

    new cdk.CfnOutput(this, "ReviewProcessingStateMachineArn", {
      value: reviewProcessor.stateMachine.stateMachineArn,
      description: "審査処理ワークフローのARN",
    });

    new cdk.CfnOutput(this, "ReviewProcessorLambdaArn", {
      value: reviewProcessor.reviewLambda.functionArn,
      description: "審査処理Lambda関数のARN",
    });

    new cdk.CfnOutput(this, "ApiUrl", {
      value: api.api.url,
      description: "BEACON API URL",
    });

    new cdk.CfnOutput(this, "ApiKeyCommand", {
      value: `aws apigateway get-api-key --api-key ${api.apiKey.keyId} --include-value --region ${this.region}`,
      description: "API Keyを取得するためのコマンド",
    });

    new cdk.CfnOutput(this, "DatabaseEndpoint", {
      value: database.cluster.clusterEndpoint.hostname,
      description: "データベースエンドポイント",
    });

    new cdk.CfnOutput(this, "DatabaseSecretArn", {
      value: database.secret.secretArn,
      description: "データベース認証情報のシークレットARN",
    });
  }
}
