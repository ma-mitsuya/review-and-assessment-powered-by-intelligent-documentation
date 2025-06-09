import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import { ChecklistProcessor } from "./constructs/checklist-processor";
import { ReviewProcessor } from "./constructs/review-processor";
import { Database } from "./constructs/database";
import { Api } from "./constructs/api";
import { Auth } from "./constructs/auth";
import { Frontend } from "./constructs/frontend";
import { PrismaMigration } from "./constructs/prisma-migration";
import { Parameters } from "./parameter-schema";

export interface RapidStackProps extends cdk.StackProps {
  readonly webAclId: string;
  readonly enableIpV6: boolean;
  readonly parameters: Parameters; // カスタムパラメータを追加
}

export class RapidStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: RapidStackProps) {
    super(scope, id, {
      description:
        "Rapid Stack for Document Processing and Review (uksb-v0ap2ubnkl)",
      ...props,
    });

    // VPC等のリソースを作成

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
    const vpc = new ec2.Vpc(this, "RapidVpc", {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          name: "public",
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
          mapPublicIpOnLaunch: false, // Disable auto-assignment of public IPs
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

    // Add VPC Flow Logs (AwsSolutions-VPC7)
    new ec2.FlowLog(this, "VpcFlowLog", {
      resourceType: ec2.FlowLogResourceType.fromVpc(vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    // データベースの作成
    const database = new Database(this, "Database", {
      vpc,
      databaseName: "rapid",
      minCapacity: 0.5,
      maxCapacity: 1,
      autoPause: true,
      autoPauseSeconds: 300,
    });

    // Prisma マイグレーション Lambda の作成
    const prismaMigration = new PrismaMigration(this, "PrismaMigration", {
      vpc,
      databaseConnection: database.connection,
      databaseCluster: database.cluster,
      autoMigrate: props.parameters.autoMigrate, // パラメータから自動マイグレーション設定を渡す
    });

    // データベース接続権限の付与
    database.grantConnect(prismaMigration.securityGroup);
    database.grantSecretAccess(prismaMigration.migrationLambda);

    // ドキュメント処理ワークフローの作成
    const documentProcessor = new ChecklistProcessor(
      this,
      "DocumentProcessor",
      {
        documentBucket,
        vpc,
        mediumDocThreshold: 40,
        largeDocThreshold: 100,
        inlineMapConcurrency: 1,
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

    // Auth構成の作成（Cognitoのカスタムパラメータを個別に渡す）
    const auth = new Auth(this, "Auth", {
      cognitoUserPoolId: props.parameters.cognitoUserPoolId,
      cognitoUserPoolClientId: props.parameters.cognitoUserPoolClientId,
      cognitoDomainPrefix: props.parameters.cognitoDomainPrefix,
      cognitoSelfSignUpEnabled: props.parameters.cognitoSelfSignUpEnabled,
    });

    // API Gatewayとそれに紐づくLambda関数の作成
    const api = new Api(this, "Api", {
      vpc,
      databaseConnection: database.connection,
      environment: {
        DOCUMENT_BUCKET: documentBucket.bucketName,
        DOCUMENT_PROCESSING_STATE_MACHINE_ARN:
          documentProcessor.stateMachine.stateMachineArn,
        REVIEW_PROCESSING_STATE_MACHINE_ARN:
          reviewProcessor.stateMachine.stateMachineArn,
      },
      auth: auth, // Authインスタンスを渡す
    });

    // データベース接続権限の付与
    database.grantConnect(api.securityGroup);
    database.grantSecretAccess(api.apiLambda);
    database.grantConnect(documentProcessor.securityGroup);
    database.grantSecretAccess(documentProcessor.documentLambda);
    database.grantConnect(reviewProcessor.securityGroup);
    database.grantSecretAccess(reviewProcessor.reviewLambda);

    // StateMachine実行権限付与
    documentProcessor.stateMachine.grantStartExecution(api.apiLambda);
    reviewProcessor.stateMachine.grantStartExecution(api.apiLambda);

    // S3バケットアクセス権限の付与
    documentBucket.grantReadWrite(api.apiLambda);

    const frontend = new Frontend(this, "Frontend", {
      accessLogBucket,
      webAclId: props.webAclId,
      enableIpV6: props.enableIpV6,
      // alternateDomainName: props.alternateDomainName,
      // hostedZoneId: props.hostedZoneId,
    });

    frontend.buildViteApp({
      backendApiEndpoint: api.api.url,
      userPoolDomainPrefix: "",
      auth,
    });

    documentBucket.addCorsRule({
      allowedMethods: [s3.HttpMethods.PUT],
      allowedOrigins: [
        `https://${frontend.cloudFrontWebDistribution.distributionDomainName}`, // frontend.getOrigin() is cyclic reference
        "http://localhost:5173",
      ],
      allowedHeaders: ["*"],
      maxAge: 3000,
    });

    // 出力
    new cdk.CfnOutput(this, "FrontendURL", {
      value: frontend.getOrigin(),
    });
    new cdk.CfnOutput(this, "DocumentBucketName", {
      value: documentBucket.bucketName,
    });

    new cdk.CfnOutput(this, "DocumentProcessingStateMachineArn", {
      value: documentProcessor.stateMachine.stateMachineArn,
    });

    new cdk.CfnOutput(this, "DocumentProcessorLambdaArn", {
      value: documentProcessor.documentLambda.functionArn,
    });

    new cdk.CfnOutput(this, "ReviewProcessingStateMachineArn", {
      value: reviewProcessor.stateMachine.stateMachineArn,
    });

    new cdk.CfnOutput(this, "ReviewProcessorLambdaArn", {
      value: reviewProcessor.reviewLambda.functionArn,
    });

    new cdk.CfnOutput(this, "ApiUrl", {
      value: api.api.url,
    });

    new cdk.CfnOutput(this, "DatabaseEndpoint", {
      value: database.cluster.clusterEndpoint.hostname,
    });

    new cdk.CfnOutput(this, "DatabaseSecretArn", {
      value: database.secret.secretArn,
    });

    new cdk.CfnOutput(this, "PrismaMigrationLambdaArn", {
      value: prismaMigration.migrationLambda.functionArn,
    });
  }
}
