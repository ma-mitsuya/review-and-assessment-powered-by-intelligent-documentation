import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';

export class BeaconStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // CloudWatch Logs 保持期間を3ヶ月に設定
    const logRetention = logs.RetentionDays.THREE_MONTHS;

    // S3 バケット - フロントエンド
    const frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    // S3 バケット - ドキュメント
    const documentsBucket = new s3.Bucket(this, 'DocumentsBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      encryption: s3.BucketEncryption.S3_MANAGED,
      lifecycleRules: [
        {
          id: 'ArchiveAfterOneYear',
          transitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(365),
            },
          ],
        },
      ],
    });

    // DynamoDB テーブル - チェックリスト
    const checklistsTable = new dynamodb.Table(this, 'ChecklistsTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
    });

    // DynamoDB テーブル - 分析結果
    const analysisResultsTable = new dynamodb.Table(this, 'AnalysisResultsTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
    });

    // Cognito ユーザープール
    const userPool = new cognito.UserPool(this, 'UserPool', {
      selfSignUpEnabled: true,
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true, mutable: true },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const userPoolClient = userPool.addClient('WebClient', {
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
          implicitCodeGrant: true,
        },
        scopes: [cognito.OAuthScope.EMAIL, cognito.OAuthScope.OPENID, cognito.OAuthScope.PROFILE],
        callbackUrls: ['http://localhost:3000/callback', 'https://example.com/callback'],
        logoutUrls: ['http://localhost:3000/', 'https://example.com/'],
      },
    });

    // Lambda 関数 - API
    const apiFunction = new nodejs.NodejsFunction(this, 'ApiFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../backend/src/handlers/index.ts'),
      handler: 'handler',
      memorySize: 1024,
      timeout: cdk.Duration.minutes(15), // ストリーミングレスポンス用に長めのタイムアウト
      environment: {
        DOCUMENTS_BUCKET_NAME: documentsBucket.bucketName,
        CHECKLISTS_TABLE_NAME: checklistsTable.tableName,
        ANALYSIS_RESULTS_TABLE_NAME: analysisResultsTable.tableName,
        USER_POOL_ID: userPool.userPoolId,
        CLIENT_ID: userPoolClient.userPoolClientId,
      },
      logRetention: logRetention,
      bundling: {
        minify: true,
        sourceMap: true,
        externalModules: ['aws-sdk'],
      },
    });

    // Lambda 関数 URL - ストリーミングレスポンス用
    const apiFunctionUrl = apiFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.AWS_IAM,
      cors: {
        allowedOrigins: ['*'], // 本番環境では制限すること
        allowedMethods: [lambda.HttpMethod.ALL],
        allowedHeaders: ['*'],
        allowCredentials: true,
      },
    });

    // Lambda 関数 - ドキュメント処理
    const documentProcessingFunction = new nodejs.NodejsFunction(this, 'DocumentProcessingFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../backend/src/handlers/document-processor.ts'),
      handler: 'handler',
      memorySize: 2048,
      timeout: cdk.Duration.minutes(15),
      environment: {
        DOCUMENTS_BUCKET_NAME: documentsBucket.bucketName,
        CHECKLISTS_TABLE_NAME: checklistsTable.tableName,
        ANALYSIS_RESULTS_TABLE_NAME: analysisResultsTable.tableName,
      },
      logRetention: logRetention,
      bundling: {
        minify: true,
        sourceMap: true,
        externalModules: ['aws-sdk'],
      },
    });

    // 必要な権限を付与
    documentsBucket.grantReadWrite(apiFunction);
    documentsBucket.grantReadWrite(documentProcessingFunction);
    checklistsTable.grantReadWriteData(apiFunction);
    checklistsTable.grantReadWriteData(documentProcessingFunction);
    analysisResultsTable.grantReadWriteData(apiFunction);
    analysisResultsTable.grantReadWriteData(documentProcessingFunction);

    // Bedrock アクセス権限
    const bedrockPolicy = new iam.PolicyStatement({
      actions: [
        'bedrock:InvokeModel',
        'bedrock:InvokeModelWithResponseStream', // ストリーミングレスポンス用
      ],
      resources: ['*'], // 本番環境では特定のモデルに制限すること
    });

    apiFunction.addToRolePolicy(bedrockPolicy);
    documentProcessingFunction.addToRolePolicy(bedrockPolicy);

    // CloudFront Origin Access Identity
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'OriginAccessIdentity');
    frontendBucket.grantRead(originAccessIdentity);

    // CloudFront ディストリビューション
    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: new origins.S3Origin(frontendBucket, {
          originAccessIdentity,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      additionalBehaviors: {
        '/api/*': {
          origin: new origins.HttpOrigin(cdk.Fn.parseDomainName(apiFunctionUrl.url)),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
        },
      },
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
    });

    // CloudFront からの Lambda 関数 URL へのアクセスを許可
    const cloudfrontServicePrincipal = new iam.ServicePrincipal('cloudfront.amazonaws.com');
    const functionUrlPolicy = new iam.PolicyStatement({
      actions: ['lambda:InvokeFunctionUrl'],
      principals: [cloudfrontServicePrincipal],
      resources: [apiFunction.functionArn],
      conditions: {
        StringEquals: {
          'AWS:SourceArn': `arn:aws:cloudfront::${this.account}:distribution/${distribution.distributionId}`,
        },
      },
    });

    apiFunction.addPermission('AllowCloudFrontInvocation', {
      principal: cloudfrontServicePrincipal,
      action: 'lambda:InvokeFunctionUrl',
      sourceArn: `arn:aws:cloudfront::${this.account}:distribution/${distribution.distributionId}`,
    });

    // 出力
    new cdk.CfnOutput(this, 'DistributionDomainName', {
      value: distribution.distributionDomainName,
      description: 'CloudFront Distribution Domain Name',
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
    });

    new cdk.CfnOutput(this, 'DocumentsBucketName', {
      value: documentsBucket.bucketName,
      description: 'Documents S3 Bucket Name',
    });
  }
}
