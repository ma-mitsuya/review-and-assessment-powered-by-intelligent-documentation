# Cognito認証機能実装計画

## 概要

BEACONアプリケーションにCognito認証機能を追加します。これには以下の3つの主要な作業が含まれます：

1. CDKでAuth構成の拡張（Cognito User Pool設定）
2. バックエンドでJWT認証ミドルウェアの実装
3. フロントエンドでAmplify Authenticatorを使った認証UI実装

既存のAPIキー認証は完全に削除し、JWT認証に置き換えます。後方互換性は考慮しません。

## 1. CDKでAuth構成の拡張

既存のAuth構成を拡張して、より詳細なCognito User Pool設定を行います。

### 新規作成するファイル
なし（既存ファイルの修正のみ）

### 修正するファイル

#### `cdk/lib/constructs/auth.ts`

```typescript
import { CfnOutput, Duration, Stack, RemovalPolicy } from "aws-cdk-lib";
import { 
  UserPool, 
  UserPoolClient, 
  UserPoolDomain,
  VerificationEmailStyle,
  AccountRecovery
} from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";

export interface AuthProps {
  userPoolDomainPrefix?: string;
}

export class Auth extends Construct {
  readonly userPool: UserPool;
  readonly client: UserPoolClient;
  readonly userPoolDomain?: UserPoolDomain;

  constructor(scope: Construct, id: string, props?: AuthProps) {
    super(scope, id);

    // より詳細な設定でUserPoolを作成
    const userPool = new UserPool(this, "UserPool", {
      passwordPolicy: {
        requireUppercase: true,
        requireSymbols: true,
        requireDigits: true,
        minLength: 8,
      },
      selfSignUpEnabled: true,
      signInAliases: {
        username: false,
        email: true,
      },
      autoVerify: {
        email: true,
      },
      accountRecovery: AccountRecovery.EMAIL_ONLY,
      removalPolicy: RemovalPolicy.DESTROY, // 開発環境用。本番環境ではRETAINを検討
      emailSettings: {
        from: "noreply@beaconapp.example.com",
        replyTo: "support@beaconapp.example.com",
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
        fullname: {
          required: false,
          mutable: true,
        },
      },
    });

    // UserPoolClientの設定
    const client = userPool.addClient(`Client`, {
      idTokenValidity: Duration.days(1),
      accessTokenValidity: Duration.hours(1),
      refreshTokenValidity: Duration.days(30),
      authFlows: {
        userPassword: true,
        userSrp: true,
        adminUserPassword: true,
      },
      preventUserExistenceErrors: true,
      enableTokenRevocation: true,
    });

    // ドメイン設定（オプション）
    let userPoolDomain;
    if (props?.userPoolDomainPrefix) {
      userPoolDomain = userPool.addDomain("Domain", {
        cognitoDomain: {
          domainPrefix: props.userPoolDomainPrefix,
        },
      });
      this.userPoolDomain = userPoolDomain;
    }

    this.client = client;
    this.userPool = userPool;

    // 出力
    new CfnOutput(this, "UserPoolId", { value: userPool.userPoolId });
    new CfnOutput(this, "UserPoolClientId", { value: client.userPoolClientId });
    if (userPoolDomain) {
      new CfnOutput(this, "UserPoolDomainUrl", { 
        value: `https://${userPoolDomain.domainName}.auth.${Stack.of(this).region}.amazoncognito.com` 
      });
    }
  }
}
```

#### `cdk/lib/constructs/api.ts`

APIキー認証を削除し、Cognito認証情報を環境変数として設定するように修正します。

```typescript
// api.ts内のAPIキー関連のコードを削除し、以下のように修正

export interface ApiProps {
  vpc: ec2.IVpc;
  databaseConnection: DatabaseConnection;
  environment: {
    DOCUMENT_BUCKET: string;
    DOCUMENT_PROCESSING_STATE_MACHINE_ARN: string;
    REVIEW_PROCESSING_STATE_MACHINE_ARN: string;
  };
  auth: Auth; // Authインスタンスを追加
}

export class Api extends Construct {
  readonly api: apigw.RestApi;
  readonly apiLambda: lambda.Function;
  readonly securityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: ApiProps) {
    super(scope, id);

    // セキュリティグループの作成
    this.securityGroup = new ec2.SecurityGroup(this, "SecurityGroup", {
      vpc: props.vpc,
      description: "Security group for API Lambda",
      allowAllOutbound: true,
    });

    // Lambda関数の作成
    this.apiLambda = new NodejsFunction(this, "ApiFunction", {
      // 既存の設定
      // ...
      environment: {
        DOCUMENT_BUCKET: props.environment.DOCUMENT_BUCKET,
        DOCUMENT_PROCESSING_STATE_MACHINE_ARN: props.environment.DOCUMENT_PROCESSING_STATE_MACHINE_ARN,
        REVIEW_PROCESSING_STATE_MACHINE_ARN: props.environment.REVIEW_PROCESSING_STATE_MACHINE_ARN,
        // Cognito関連の環境変数を追加
        COGNITO_USER_POOL_ID: props.auth.userPool.userPoolId,
        COGNITO_CLIENT_ID: props.auth.client.userPoolClientId,
        AWS_REGION: Stack.of(this).region,
      },
      // ...
    });

    // API Gatewayの作成（APIキー認証を削除）
    this.api = new apigw.RestApi(this, "RestApi", {
      restApiName: "BEACON API",
      description: "API for BEACON application",
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: apigw.Cors.ALL_METHODS,
        allowHeaders: [
          "Content-Type",
          "X-Amz-Date",
          "Authorization",
          "X-Api-Key",
          "X-Amz-Security-Token",
        ],
      },
      deployOptions: {
        stageName: "v1",
        loggingLevel: apigw.MethodLoggingLevel.INFO,
      },
    });

    // Lambda統合の設定
    const lambdaIntegration = new apigw.LambdaIntegration(this.apiLambda);

    // ルートリソースの設定
    const apiResource = this.api.root.addResource("api");
    apiResource.addMethod("ANY", lambdaIntegration);
    apiResource.addProxy({
      defaultIntegration: lambdaIntegration,
    });
  }
}
```

#### `cdk/lib/beacon-stack.ts`

Authインスタンスをapiに渡すように修正します。

```typescript
// APIの作成部分を修正
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
```
