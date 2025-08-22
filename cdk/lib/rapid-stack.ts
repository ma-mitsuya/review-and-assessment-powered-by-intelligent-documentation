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
import { McpRuntime } from "./constructs/mcp-runtime/mcp-runtime";
import { S3TempStorage } from "./constructs/s3-temp-storage";
import { Parameters } from "./parameter-schema";
import { execSync } from "child_process";

export interface RapidStackProps extends cdk.StackProps {
  readonly webAclArn: string;
  readonly enableIpV6: boolean;
  readonly parameters: Parameters; // カスタムパラメータを追加
}

export class RapidStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: RapidStackProps) {
    super(scope, id, {
      description:
        "Rapid Stack for Document Processing and Review (uksb-pr771pp43k)",
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

    // MCP Runner for MCP functionality
    const mcpRuntime = new McpRuntime(this, "McpRuntime", {
      timeout: cdk.Duration.minutes(15),
      admin: props.parameters.mcpAdmin,
    });

    // S3 Temp Storage for Step Functions large data handling
    const s3TempStorage = new S3TempStorage(this, "S3TempStorage", {
      accessLogBucket,
    });

    // ドキュメント処理ワークフローの作成
    const documentProcessor = new ChecklistProcessor(
      this,
      "DocumentProcessor",
      {
        documentBucket,
        vpc,
        mediumDocThreshold: 40,
        largeDocThreshold: 100,
        inlineMapConcurrency:
          props.parameters.checklistInlineMapConcurrency || 1,
        logLevel: sfn.LogLevel.ALL,
        databaseConnection: database.connection,
        documentProcessingModelId: props.parameters.documentProcessingModelId,
        bedrockRegion: props.parameters.bedrockRegion,
      }
    );

    // 審査ワークフローの作成
    const reviewProcessor = new ReviewProcessor(this, "ReviewProcessor", {
      documentBucket,
      tempBucket: s3TempStorage.bucket,
      vpc,
      logLevel: sfn.LogLevel.ALL,
      maxConcurrency: props.parameters.reviewMapConcurrency || 1,
      databaseConnection: database.connection,
      McpRuntime: mcpRuntime,
      documentProcessingModelId: props.parameters.documentProcessingModelId,
      imageReviewModelId: props.parameters.imageReviewModelId,
      bedrockRegion: props.parameters.bedrockRegion,
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
      webAclId: props.webAclArn, 
      enableIpV6: props.enableIpV6,
      // alternateDomainName: props.alternateDomainName,
      // hostedZoneId: props.hostedZoneId,
    });

    // Gitの最新タグを取得
    const latestGitTag = this.getLatestGitTag();

    frontend.buildViteApp({
      backendApiEndpoint: api.api.url,
      userPoolDomainPrefix: "",
      auth,
      version: latestGitTag, // Gitタグ情報を追加
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

    // Gitの最新タグをCloudFormation出力に追加
    new cdk.CfnOutput(this, "LatestGitTag", {
      value: latestGitTag,
      description: "デプロイされたコードの最新Gitタグ",
    });

    // Fix migrationLambda.functionArn
    if (
      prismaMigration.migrationLambda &&
      "functionArn" in prismaMigration.migrationLambda
    ) {
      new cdk.CfnOutput(this, "PrismaMigrationLambdaArn", {
        value: prismaMigration.migrationLambda.functionArn,
      });
    }
  }

  /**
   * Gitリポジトリの最新タグを取得する
   * @returns 最新のGitタグ、取得できない場合は'no-tag-found'
   * @private
   */
  private getLatestGitTag(): string {
    try {
      // git describe --tags --abbrev=0 コマンドで最新のタグを取得
      return execSync("git describe --tags --abbrev=0").toString().trim();
    } catch (error) {
      // タグが存在しない場合や、Gitコマンドが失敗した場合のフォールバック
      cdk.Annotations.of(this).addWarning(
        `Failed to get latest Git tag: ${error}`
      );
      return "no-tag-found";
    }
  }
}
