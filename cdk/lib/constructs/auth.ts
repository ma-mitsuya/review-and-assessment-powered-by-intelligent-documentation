import { CfnOutput, Duration, Stack, RemovalPolicy } from "aws-cdk-lib";
import { 
  UserPool, 
  UserPoolClient, 
  UserPoolDomain,
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
      // standardAttributesを完全に削除
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
