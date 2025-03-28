import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as iam from "aws-cdk-lib/aws-iam";
import * as rds from "aws-cdk-lib/aws-rds";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as path from "path";
import { Construct } from "constructs";
import { Duration } from "aws-cdk-lib";

/**
 * S3 -> SQS -> Lambda -> Aurora ETLパイプラインのプロパティ
 */
export interface S3SqsEtlAuroraProps {
  /**
   * ドキュメントを保存するS3バケット
   */
  documentBucket: s3.IBucket;

  /**
   * CSVファイルのプレフィックス（オプション）
   * @default "csv/"
   */
  csvPrefix?: string;

  /**
   * VPC
   */
  vpc: ec2.IVpc;

  /**
   * Aurora Serverless v2クラスターのデータベース名
   * @default "beacon"
   */
  databaseName?: string;

  /**
   * Aurora Serverless v2クラスターの最小キャパシティユニット
   * @default 0.5
   */
  minCapacity?: number;

  /**
   * Aurora Serverless v2クラスターの最大キャパシティユニット
   * @default 1
   */
  maxCapacity?: number;
}

/**
 * S3 -> SQS -> Lambda -> Aurora ETLパイプラインを実装するCDK Construct
 */
export class S3SqsEtlAurora extends Construct {
  /**
   * SQSキュー
   */
  public readonly queue: sqs.Queue;

  /**
   * ETL Lambda関数
   */
  public readonly etlLambda: lambda.Function;

  /**
   * Aurora Serverless v2クラスター
   */
  public readonly auroraCluster: rds.ServerlessCluster;

  constructor(scope: Construct, id: string, props: S3SqsEtlAuroraProps) {
    super(scope, id);

    // デフォルト値の設定
    const csvPrefix = props.csvPrefix || "csv/";
    const databaseName = props.databaseName || "beacon";
    const minCapacity = props.minCapacity || 0.5;
    const maxCapacity = props.maxCapacity || 1;

    // SQSキューの作成
    this.queue = new sqs.Queue(this, "CsvProcessingQueue", {
      visibilityTimeout: Duration.minutes(5),
      retentionPeriod: Duration.days(14),
      deadLetterQueue: {
        queue: new sqs.Queue(this, "DeadLetterQueue", {
          retentionPeriod: Duration.days(14),
        }),
        maxReceiveCount: 3,
      },
    });

    // S3イベント通知の設定
    props.documentBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.SqsDestination(this.queue),
      { prefix: csvPrefix }
    );

    // Aurora Serverless v2クラスターの作成
    this.auroraCluster = new rds.ServerlessCluster(this, "AuroraCluster", {
      engine: rds.DatabaseClusterEngine.auroraMysql({
        version: rds.AuroraMysqlEngineVersion.VER_3_04_0,
      }),
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      scaling: {
        minCapacity: minCapacity,
        maxCapacity: maxCapacity,
        autoPause: Duration.minutes(10),
      },
      defaultDatabaseName: databaseName,
      deletionProtection: false, // 開発環境用の設定。本番環境ではtrueにすること
      removalPolicy: cdk.RemovalPolicy.DESTROY, // 開発環境用の設定。本番環境ではRETAINにすること
    });

    // ETL Lambda関数の作成
    this.etlLambda = new nodejs.NodejsFunction(this, "EtlFunction", {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "handler",
      entry: path.join(__dirname, "../../../backend/src/handlers/csv-etl-handler.ts"),
      timeout: Duration.minutes(5),
      memorySize: 1024,
      environment: {
        DOCUMENT_BUCKET: props.documentBucket.bucketName,
        CSV_PREFIX: csvPrefix,
        DB_SECRET_ARN: this.auroraCluster.secret?.secretArn || "",
        DB_NAME: databaseName,
      },
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      bundling: {
        sourceMap: true,
        externalModules: ["aws-sdk", "canvas"],
      },
    });

    // Lambda関数にS3バケットへのアクセス権限を付与
    props.documentBucket.grantRead(this.etlLambda);

    // Lambda関数にSQSキューからのメッセージ受信権限を付与
    this.queue.grantConsumeMessages(this.etlLambda);

    // Lambda関数にAuroraシークレットへのアクセス権限を付与
    if (this.auroraCluster.secret) {
      this.auroraCluster.secret.grantRead(this.etlLambda);
    }

    // Lambda関数にAuroraへの接続権限を付与
    this.etlLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          "rds-data:ExecuteStatement",
          "rds-data:BatchExecuteStatement",
          "rds-data:BeginTransaction",
          "rds-data:CommitTransaction",
          "rds-data:RollbackTransaction"
        ],
        resources: [this.auroraCluster.clusterArn],
      })
    );

    // SQSをLambdaのイベントソースとして設定
    const eventSource = new lambda.EventSourceMapping(this, "SqsEventSource", {
      target: this.etlLambda,
      eventSourceArn: this.queue.queueArn,
      batchSize: 10,
      maxBatchingWindow: Duration.seconds(30),
    });
  }
}
