/**
 * RAPID API 構成
 */
import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";
import * as logs from "aws-cdk-lib/aws-logs";
import * as path from "path";
import { Construct } from "constructs";
import { Auth } from "./auth";
import { Platform } from "aws-cdk-lib/aws-ecr-assets";
import { DatabaseConnectionProps } from "./database";

/**
 * API Constructのプロパティ
 */
export interface ApiProps {
  vpc: ec2.IVpc;
  databaseConnection: DatabaseConnectionProps;
  environment?: { [key: string]: string };
  auth: Auth; // Authインスタンスを追加
}

/**
 * RAPID API Construct
 */
export class Api extends Construct {
  public readonly apiLambda: lambda.DockerImageFunction;
  public readonly api: apigateway.RestApi;
  public readonly securityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: ApiProps) {
    super(scope, id);

    // セキュリティグループの作成
    this.securityGroup = new ec2.SecurityGroup(this, "ApiSecurityGroup", {
      vpc: props.vpc,
      description: "Security group for API Lambda function",
      allowAllOutbound: true,
    });

    // Role
    const handlerRole = new iam.Role(scope, "HandlerRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });
    // Add VPC access to the Lambda function
    handlerRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaVPCAccessExecutionRole"
      )
    );

    // Lambda 関数の作成
    this.apiLambda = new lambda.DockerImageFunction(this, "ApiFunction", {
      role: handlerRole,
      code: lambda.DockerImageCode.fromImageAsset(
        path.join(__dirname, "../../../backend"),
        {
          platform: Platform.LINUX_AMD64,
        }
      ),
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [this.securityGroup], // セキュリティグループを設定
      // environment: props?.environment,
      environment: {
        ...props.environment,
        DATABASE_HOST: props.databaseConnection.host,
        DATABASE_PORT: props.databaseConnection.port,
        DATABASE_ENGINE: props.databaseConnection.engine,
        DATABASE_USER: props.databaseConnection.username,
        DATABASE_PASSWORD: props.databaseConnection.password,
        DATABASE_NAME: props.databaseConnection.databaseName,
        // Aurora Serverless v2 cold start takes up to 15 seconds
        // https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections/connection-pool
        DATABASE_OPTION: "?pool_timeout=20&connect_timeout=20",
        // Cognito関連の環境変数を追加
        COGNITO_USER_POOL_ID: props.auth.userPool.userPoolId,
        COGNITO_CLIENT_ID: props.auth.client.userPoolClientId,
        // AWS_REGIONは予約済み環境変数なので設定しない
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 1024,
    });

    // CloudWatch Logs グループの作成
    const accessLogGroup = new logs.LogGroup(this, "ApiGatewayAccessLogs", {
      retention: logs.RetentionDays.ONE_WEEK,
      logGroupName: `/aws/apigateway/rapid-api-access-logs`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const executionLogGroup = new logs.LogGroup(
      this,
      "ApiGatewayExecutionLogs",
      {
        retention: logs.RetentionDays.ONE_WEEK,
        logGroupName: `/aws/apigateway/rapid-api-execution-logs`,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // API Gateway CloudWatch ロールの作成
    const apiGatewayCloudWatchRole = new iam.Role(
      this,
      "ApiGatewayCloudWatchRole",
      {
        assumedBy: new iam.ServicePrincipal("apigateway.amazonaws.com"),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            "service-role/AmazonAPIGatewayPushToCloudWatchLogs"
          ),
        ],
      }
    );

    // API Gateway の作成
    this.api = new apigateway.RestApi(this, "RapidApi", {
      restApiName: "RAPID API",
      description:
        "RAPID (Review & Assessment Powered by Intelligent Documentation) API",
      deployOptions: {
        stageName: "api",
        tracingEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        // アクセスログの設定を追加
        accessLogDestination: new apigateway.LogGroupLogDestination(
          accessLogGroup
        ),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields({
          caller: true,
          httpMethod: true,
          ip: true,
          protocol: true,
          requestTime: true,
          resourcePath: true,
          responseLength: true,
          status: true,
          user: true,
        }),
        // 実行ログの設定
        methodOptions: {
          "/*/*": {
            loggingLevel: apigateway.MethodLoggingLevel.INFO,
          },
        },
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          "Content-Type",
          "X-Amz-Date",
          "Authorization",
          "X-Api-Key",
          "X-Amz-Security-Token",
        ],
      },
      apiKeySourceType: apigateway.ApiKeySourceType.HEADER,
      // CloudWatch ロールを設定
      cloudWatchRole: true,
    });

    // Lambda 統合の設定
    const lambdaIntegration = new apigateway.LambdaIntegration(this.apiLambda, {
      proxy: true,
    });

    // プロキシリソースの設定
    const proxyResource = this.api.root.addResource("{proxy+}");
    proxyResource.addMethod("ANY", lambdaIntegration);

    // API Key関連のコードを削除

    // API URL の出力
    new cdk.CfnOutput(this, "ApiUrl", {
      value: this.api.url,
      description: "URL of the RAPID API",
    });

    // ロググループの ARN を出力
    new cdk.CfnOutput(this, "AccessLogGroupName", {
      value: accessLogGroup.logGroupName,
      description: "Name of the API Gateway access log group",
    });

    new cdk.CfnOutput(this, "ExecutionLogGroupName", {
      value: executionLogGroup.logGroupName,
      description: "Name of the API Gateway execution log group",
    });
  }
}
