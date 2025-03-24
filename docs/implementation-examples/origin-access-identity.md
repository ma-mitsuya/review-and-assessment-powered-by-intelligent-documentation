[AWS CDK] CloudFront Distribution への OAC の設定が L2 Construct で可能になりました
#Amazon CloudFront#AWS CDK
若槻龍太
若槻龍太

facebook logo
hatena logo
twitter logo
Clock Icon
2024.09.07
こんにちは、製造ビジネステクノロジー部の若槻です。

AWS CDK の最新のリリースで、下記のアップデートが追加されていました。

cloudfront: s3 origin access control L2 construct (#31254) (30675f0), closes #21771

Origin Access Control (OAC) とは、2022 年に新しく利用可能となった CloudFront が S3 バケットにアクセスする際のアクセス制御機能で、今まで利用可能だった Origin Access Identity (OAI) と比べて追加のセキュリティ機能が提供されており、現在は OAC の利用が推奨されています。

今回の AWS CDK のアップデートでは、OAC の設定がついに AWS CDK の L2 Construct で可能となりました。

試してみた
CDK パッケージのアップデート
AWS CDK パッケージを v2.156.0 以上にアップデートします。

npm i aws-cdk-lib@latest aws-cdk@latest
OAI の場合の実装
まず比較のために、従来の OAI を利用した場合の実装を確認してみます。

CDK コードは次の通りです。OAI のリソースは個別に作成する必要があります。

lib/cdk-sample-stack.ts
import _ as s3 from 'aws-cdk-lib/aws-s3';
import _ as s3_deployment from 'aws-cdk-lib/aws-s3-deployment';
import _ as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import _ as cloudfront_origins from 'aws-cdk-lib/aws-cloudfront-origins';
import \* as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class CdkSampleStack extends cdk.Stack {
constructor(scope: Construct, id: string) {
super(scope, id);

    // Web サイトホスティング用 S3 バケットの作成
    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // OAI の作成と、S3 バケット読み取り権限の付与
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(
      this,
      'OriginAccessIdentity'
    );
    websiteBucket.grantRead(originAccessIdentity);

    // CloudFront ディストリビューションの作成
    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: new cloudfront_origins.S3Origin(websiteBucket, {
          originAccessIdentity,
        }),
      },
    });

    // CloudFront Distribution の URL を出力
    new cdk.CfnOutput(this, 'DistributionUrl', {
      value: `https://${distribution.distributionDomainName}`,
    });

    // S3 バケットへのコンテンツのデプロイ
    new s3_deployment.BucketDeployment(this, 'WebsiteDeploy', {
      sources: [
        s3_deployment.Source.data(
          '/index.html',
          '<html><body><h1>Hello, OAI!</h1></body></html>'
        ),
        s3_deployment.Source.data('/favicon.ico', ''),
      ],
      destinationBucket: websiteBucket,
      distribution: distribution,
      distributionPaths: ['/*'],
    });

}
}
上記を CDK デプロイします。OAI の利用は非推奨であることを警告するため、デプロイ時に次のように WARNING が表示されます。

$ npm run deploy

> cdk_sample_app@0.1.0 deploy
> cdk deploy --require-approval never --method=direct

[WARNING] aws-cdk-lib.aws_cloudfront_origins.S3Origin is deprecated.
Use `S3BucketOrigin` or `S3StaticWebsiteOrigin` instead.
This API will be removed in the next major release.
[WARNING] aws-cdk-lib.aws_cloudfront_origins.S3Origin#bind is deprecated.
Use `S3BucketOrigin` or `S3StaticWebsiteOrigin` instead.
This API will be removed in the next major release.
CloudFormation の Construct ツリーをダッシュボードで確認すると、OAI が作成されていることが確認できます。

CloudFront Distribution の Origin をダッシュボードで確認すると、OAI が設定されていることが確認できます。s

Distribution URL にリクエストすると、CloudFront から S3 バケット内のコンテンツにアクセス可能となっています。

$ curl https://dpi1gyc0g1a13.cloudfront.net

<html><body><h1>Hello, CDK!</h1></body></html>
OAC の場合の実装
次に OAC を利用した場合の実装を確認してみます。

CDK コードは次の通りです。OAC の明示的な作成は必要なく、S3BucketOrigin.withOriginAccessControl() で S3 バケットを指定してオリジンを作成するだけです。

lib/cdk-sample-stack.ts
import _ as s3 from 'aws-cdk-lib/aws-s3';
import _ as s3_deployment from 'aws-cdk-lib/aws-s3-deployment';
import _ as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import _ as cloudfront_origins from 'aws-cdk-lib/aws-cloudfront-origins';
import \* as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class CdkSampleStack extends cdk.Stack {
constructor(scope: Construct, id: string) {
super(scope, id);

    // Web サイトホスティング用 S3 バケットの作成
    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // CloudFront ディストリビューションの作成
    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin:
          // S3 バケットへの OAC によるアクセス制御を設定
          cloudfront_origins.S3BucketOrigin.withOriginAccessControl(
            websiteBucket
          ),
      },
    });

    // CloudFront Distribution の URL を出力
    new cdk.CfnOutput(this, 'DistributionUrl', {
      value: `https://${distribution.distributionDomainName}`,
    });

    // S3 バケットへのコンテンツのデプロイ
    new s3_deployment.BucketDeployment(this, 'WebsiteDeploy', {
      sources: [
        s3_deployment.Source.data(
          '/index.html',
          '<html><body><h1>Hello, CDK!</h1></body></html>'
        ),
        s3_deployment.Source.data('/favicon.ico', ''),
      ],
      destinationBucket: websiteBucket,
      distribution: distribution,
      distributionPaths: ['/*'],
    });

}
}
OAI を利用した場合との CDK コードの差分は以下の通りです。

$ git diff
diff --git a/lib/cdk-sample-stack.ts b/lib/cdk-sample-stack.ts
index 67fc6ee..b09b8c7 100644
--- a/lib/cdk-sample-stack.ts
+++ b/lib/cdk-sample-stack.ts
@@ -15,20 +15,14 @@ export class CdkSampleStack extends cdk.Stack {
autoDeleteObjects: true,
});

    // OAI の作成と、S3 バケット読み取り権限の付与
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(
      this,
      'OriginAccessIdentity'
    );
    websiteBucket.grantRead(originAccessIdentity);

    // CloudFront ディストリビューションの作成
    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: new cloudfront_origins.S3Origin(websiteBucket, {
          originAccessIdentity,
        }),
        origin:
          cloudfront_origins.S3BucketOrigin.withOriginAccessControl(
            websiteBucket
          ),
      },
    });

CDK 合成結果の差分は次の通りです。大きな違いとして、OAI では CanonicalUser に対してのアクセス制御が設定されているのに対し、OAC では cloudfront.amazonaws.com Service に対してのアクセス制御が設定されていることがわかります。

$ npx cdk diff
Stack CdkSampleStack
Hold on while we create a read-only change set to get a diff with accurate replacement information (use --no-change-set to use a less accurate but faster template-only diff)
IAM Statement Changes
┌───┬─────────────────────────────────────────────────┬────────┬─────────────────────────────────────────────────┬─────────────────────────────────────────────────┬─────────────────────────────────────────────────┐
│ │ Resource │ Effect │ Action │ Principal │ Condition │
├───┼─────────────────────────────────────────────────┼────────┼─────────────────────────────────────────────────┼─────────────────────────────────────────────────┼─────────────────────────────────────────────────┤
│ - │ ${WebsiteBucket.Arn}                            │ Allow  │ s3:GetBucket*                                   │ CanonicalUser:${OriginAccessIdentity.S3Canonica │ │
│ │ ${WebsiteBucket.Arn}/*                          │        │ s3:GetObject*                                   │ lUserId}                                        │                                                 │
│   │                                                 │        │ s3:List*                                        │                                                 │                                                 │
├───┼─────────────────────────────────────────────────┼────────┼─────────────────────────────────────────────────┼─────────────────────────────────────────────────┼─────────────────────────────────────────────────┤
│ - │ ${WebsiteBucket.Arn}/*                          │ Allow  │ s3:GetObject                                    │ CanonicalUser:${OriginAccessIdentity.S3Canonica │ │
│ │ │ │ │ lUserId} │ │
├───┼─────────────────────────────────────────────────┼────────┼─────────────────────────────────────────────────┼─────────────────────────────────────────────────┼─────────────────────────────────────────────────┤
│ + │ ${WebsiteBucket.Arn}/*                          │ Allow  │ s3:GetObject                                    │ Service:cloudfront.amazonaws.com                │ "StringEquals": {                               │
│   │                                                 │        │                                                 │                                                 │   "AWS:SourceArn": "arn:${AWS::Partition}:cloud │
│ │ │ │ │ │ front::${AWS::AccountId}:distribution/${Distrib │
│ │ │ │ │ │ ution}" │
│ │ │ │ │ │ } │
└───┴─────────────────────────────────────────────────┴────────┴─────────────────────────────────────────────────┴─────────────────────────────────────────────────┴─────────────────────────────────────────────────┘
(NOTE: There may be security-related changes not in this list. See https://github.com/aws/aws-cdk/issues/1299)

Resources
[-] AWS::CloudFront::CloudFrontOriginAccessIdentity OriginAccessIdentity OriginAccessIdentityDF1E3CAC destroy
[+] AWS::CloudFront::OriginAccessControl Distribution/Origin1/S3OriginAccessControl DistributionOrigin1S3OriginAccessControlEB606076
[~] AWS::S3::BucketPolicy WebsiteBucket/Policy WebsiteBucketPolicyE10E3262
└─ [~] PolicyDocument
└─ [~] .Statement:
└─ @@ -39,53 +39,33 @@
[ ] ]
[ ] },
[ ] {
[-] "Action": [
[-] "s3:GetBucket*",
[-] "s3:GetObject*",
[-] "s3:List*"
[-] ],
[-] "Effect": "Allow",
[-] "Principal": {
[-] "CanonicalUser": {
[-] "Fn::GetAtt": [
[-] "OriginAccessIdentityDF1E3CAC",
[-] "S3CanonicalUserId"
[-] ]
[+] "Action": "s3:GetObject",
[+] "Condition": {
[+] "StringEquals": {
[+] "AWS:SourceArn": {
[+] "Fn::Join": [
[+] "",
[+] [
[+] "arn:",
[+] {
[+] "Ref": "AWS::Partition"
[+] },
[+] ":cloudfront::",
[+] {
[+] "Ref": "AWS::AccountId"
[+] },
[+] ":distribution/",
[+] {
[+] "Ref": "Distribution830FAC52"
[+] }
[+] ]
[+] ]
[+] }
[ ] }
[ ] },
[-] "Resource": [
[-] {
[-] "Fn::GetAtt": [
[-] "WebsiteBucket75C24D94",
[-] "Arn"
[-] ]
[-] },
[-] {
[-] "Fn::Join": [
[-] "",
[-] [
[-] {
[-] "Fn::GetAtt": [
[-] "WebsiteBucket75C24D94",
[-] "Arn"
[-] ]
[-] },
[-] "/*"
[-] ]
[-] ]
[-] }
[-] ]
[-] },
[-] {
[-] "Action": "s3:GetObject",
[ ] "Effect": "Allow",
[ ] "Principal": {
[-] "CanonicalUser": {
[-] "Fn::GetAtt": [
[-] "OriginAccessIdentityDF1E3CAC",
[-] "S3CanonicalUserId"
[-] ]
[-] }
[+] "Service": "cloudfront.amazonaws.com"
[ ] },
[ ] "Resource": {
[ ] "Fn::Join": [
[~] AWS::CloudFront::Distribution Distribution Distribution830FAC52
└─ [~] DistributionConfig
└─ [~] .Origins:
└─ @@ -7,18 +7,14 @@
[ ] ]
[ ] },
[ ] "Id": "CdkSampleStackDistributionOrigin19777632A",
[+] "OriginAccessControlId": {
[+] "Fn::GetAtt": [
[+] "DistributionOrigin1S3OriginAccessControlEB606076",
[+] "Id"
[+] ]
[+] },
[ ] "S3OriginConfig": {
[-] "OriginAccessIdentity": {
[-] "Fn::Join": [
[-] "",
[-] [
[-] "origin-access-identity/cloudfront/",
[-] {
[-] "Ref": "OriginAccessIdentityDF1E3CAC"
[-] }
[-] ]
[-] ]
[-] }
[+] "OriginAccessIdentity": ""
[ ] }
[ ] }
[ ] ]

✨ Number of stacks with differences: 1
CDK デプロイを行います。この時、先程の Warning は表示されなくなっています。

$ npm run deploy

> cdk_sample_app@0.1.0 deploy
> cdk deploy --require-approval never --method=direct

✨ Synthesis time: 3.37s
CloudFormation の Construct ツリーをダッシュボードで確認すると、OAC が作成されていることが確認できます。ここで OAI はルートに独立したリソースとして作成されていたのに対し、OAC は Distribution の Origin の設定の一部となっていることがわかります。

CloudFront Distribution の Origin をダッシュボードで確認すると、OAC が設定されていることが確認できます。

同じ Distribution URL にリクエストすると、引き続きアクセスが可能となっています。

$ curl https://dpi1gyc0g1a13.cloudfront.net

<html><body><h1>Hello, CDK!</h1></body></html>
おわりに
AWS CDK のアップデートで、AWS CDK の L2 Construct で　OAC の設定が可能となっていたのでご紹介しました。

今まで CDK で OAC を設定する場合はエスケープハッチによるハック的な実装が必要でしたが、今後はより簡単な実装で OAC の利用が可能となるので、とても待ち望まれていたアップデートだったのではないでしょうか。

以上
