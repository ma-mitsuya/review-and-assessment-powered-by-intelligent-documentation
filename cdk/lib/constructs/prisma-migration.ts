/**
 * Prisma マイグレーション実行用 Lambda 構成
 */
import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as path from "path";
import { Construct } from "constructs";
import {
  DockerPrismaFunction,
  DatabaseConnectionProps,
} from "./docker-prisma-function";
import { DockerImageCode, Runtime } from "aws-cdk-lib/aws-lambda";
import { Platform } from "aws-cdk-lib/aws-ecr-assets";

/**
 * PrismaMigration Constructのプロパティ
 */
export interface PrismaMigrationProps {
  vpc: ec2.IVpc;
  databaseConnection: DatabaseConnectionProps;
}

/**
 * Prisma マイグレーション実行用 Lambda Construct
 */
export class PrismaMigration extends Construct {
  public readonly migrationLambda: DockerPrismaFunction;
  public readonly securityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: PrismaMigrationProps) {
    super(scope, id);

    // セキュリティグループの作成
    this.securityGroup = new ec2.SecurityGroup(this, "MigrationSecurityGroup", {
      vpc: props.vpc,
      description: "Security group for Prisma Migration Lambda function",
      allowAllOutbound: true,
    });

    // Lambda 関数の作成
    this.migrationLambda = new DockerPrismaFunction(this, "MigrationFunction", {
      code: DockerImageCode.fromImageAsset(
        path.join(__dirname, "../../../backend/"),
        {
          file: "Dockerfile.prisma.lambda",
          platform: Platform.LINUX_AMD64,
          cmd: ["dist/handlers/migration-runner.handler"],
        }
      ),
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [this.securityGroup],
      database: props.databaseConnection,
      timeout: cdk.Duration.minutes(15),
      memorySize: 1024,
    });

    // CLI コマンドの出力
    new cdk.CfnOutput(this, "DeployMigrationCommand", {
      value: `aws lambda invoke --function-name ${
        this.migrationLambda.functionName
      } --payload '{"command":"deploy"}' --region ${
        cdk.Stack.of(this).region
      } output.json`,
      description: "マイグレーションを実行するコマンド (deploy)",
    });

    new cdk.CfnOutput(this, "ResetMigrationCommand", {
      value: `aws lambda invoke --function-name ${
        this.migrationLambda.functionName
      } --payload '{"command":"reset"}' --region ${
        cdk.Stack.of(this).region
      } output.json`,
      description: "マイグレーションをリセットするコマンド (reset)",
    });
  }
}
