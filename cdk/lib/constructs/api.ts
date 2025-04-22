/**
 * BEACON API 構成
 */
import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";
import * as path from "path";
import { Construct } from "constructs";

/**
 * API Constructのプロパティ
 */
export interface ApiProps {
  vpc: ec2.IVpc;
  environment?: { [key: string]: string };
}

/**
 * BEACON API Construct
 */
export class Api extends Construct {
  public readonly apiLambda: lambda.DockerImageFunction;
  public readonly api: apigateway.RestApi;
  public readonly apiKey: apigateway.ApiKey;
  public readonly usagePlan: apigateway.UsagePlan;
  public readonly securityGroup: ec2.SecurityGroup; // 追加

  constructor(scope: Construct, id: string, props: ApiProps) {
    super(scope, id);

    // セキュリティグループの作成
    this.securityGroup = new ec2.SecurityGroup(this, "ApiSecurityGroup", {
      vpc: props.vpc,
      description: "Security group for API Lambda function",
      allowAllOutbound: true,
    });

    // Lambda 関数の作成
    this.apiLambda = new lambda.DockerImageFunction(this, "ApiFunction", {
      code: lambda.DockerImageCode.fromImageAsset(
        path.join(__dirname, "../../../backend")
      ),
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [this.securityGroup], // セキュリティグループを設定
      environment: props?.environment,
      timeout: cdk.Duration.seconds(30),
      memorySize: 1024,
    });

    // API Gateway の作成
    this.api = new apigateway.RestApi(this, "BeaconApi", {
      restApiName: "BEACON API",
      description:
        "BEACON (Building & Engineering Approval Compliance Navigator) API",
      deployOptions: {
        stageName: "api",
        tracingEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
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
    });

    // Lambda 統合の設定
    const lambdaIntegration = new apigateway.LambdaIntegration(this.apiLambda, {
      proxy: true,
    });

    // プロキシリソースの設定
    const proxyResource = this.api.root.addResource("{proxy+}");
    proxyResource.addMethod("ANY", lambdaIntegration, {
      apiKeyRequired: true,
    });

    // API Key の作成
    this.apiKey = new apigateway.ApiKey(this, "BeaconApiKey", {
      apiKeyName: "beacon-api-key",
      description: "API Key for BEACON API",
      enabled: true,
    });

    // 使用量プランの作成
    this.usagePlan = new apigateway.UsagePlan(this, "BeaconUsagePlan", {
      name: "BeaconUsagePlan",
      description: "Usage plan for BEACON API",
      apiStages: [
        {
          api: this.api,
          stage: this.api.deploymentStage,
        },
      ],
      throttle: {
        rateLimit: 10,
        burstLimit: 20,
      },
      quota: {
        limit: 10000,
        period: apigateway.Period.DAY,
      },
    });

    // 使用量プランに API Key を追加
    this.usagePlan.addApiKey(this.apiKey);

    // API Key 取得コマンドの出力
    new cdk.CfnOutput(this, "ApiKeyCommand", {
      value: `aws apigateway get-api-key --api-key ${
        this.apiKey.keyId
      } --include-value --region ${cdk.Stack.of(this).region}`,
      description: "Command to get the API Key value",
    });

    // API URL の出力
    new cdk.CfnOutput(this, "ApiUrl", {
      value: this.api.url,
      description: "URL of the BEACON API",
    });
  }
}
