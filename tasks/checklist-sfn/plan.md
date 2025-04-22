# BEACON チェックリスト SFn 修正計画書

## 問題の概要

AWS Lambda 環境で Prisma Client が Query Engine を見つけられないエラーが発生しています。

```
PrismaClientInitializationError: Prisma Client could not locate the Query Engine for runtime "rhel-openssl-3.0.x".

This is likely caused by a bundler that has not copied "libquery_engine-rhel-openssl-3.0.x.so.node" next to the resulting bundle.
Ensure that "libquery_engine-rhel-openssl-3.0.x.so.node" has been copied next to the bundle or in "node_modules/.prisma/client".
```

このエラーは、Lambda 関数のデプロイパッケージに Prisma の Query Engine バイナリが含まれていないことが原因です。

## 現状の調査結果

1. **エラーの発生箇所**:
   - `backend/src/checklist-workflow/store-to-db/index.ts` で `getPrismaClient()` を呼び出した際に発生

2. **CDK の Lambda 関数定義**:
   - `cdk/lib/constructs/document-page-processor.ts` で `NodejsFunction` を使用
   - 現在の bundling 設定:
     ```typescript
     bundling: {
       sourceMap: true,
       externalModules: ["aws-sdk", "canvas"],
     }
     ```
   - Prisma 関連のモジュールが外部化されておらず、バイナリも含まれていない

3. **Prisma の設定**:
   - `backend/prisma/schema.prisma` に `binaryTargets` の指定がない
   - Lambda 環境 (Node.js 22.x) では `rhel-openssl-3.0.x` のバイナリが必要

## 修正計画

### 1. Prisma スキーマの修正

**ファイル**: `backend/prisma/schema.prisma`

```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-3.0.x"]
}
```

### 2. CDK Lambda 関数定義の修正

**ファイル**: `cdk/lib/constructs/document-page-processor.ts`

```typescript
this.documentLambda = new nodejs.NodejsFunction(this, "DocumentProcessorFunction", {
  runtime: lambda.Runtime.NODEJS_22_X,
  handler: "handler",
  entry: path.join(__dirname, "../../../backend/src/checklist-workflow/index.ts"),
  timeout: Duration.minutes(15),
  memorySize: 1024,
  environment: {
    DOCUMENT_BUCKET: props.documentBucket.bucketName,
    BEDROCK_REGION: "us-west-2",
  },
  bundling: {
    sourceMap: true,
    externalModules: ["aws-sdk", "canvas", "prisma", "@prisma/client"],
    commandHooks: {
      beforeInstall: (inputDir, outputDir) => [
        `cp -r ${inputDir}/prisma ${outputDir}`,
      ],
    },
  },
});
```

### 3. Prisma クライアントの再生成

デプロイ前に以下のコマンドを実行して、必要なバイナリを含む Prisma クライアントを生成します。

```bash
cd backend
npx prisma generate
```

## 実装手順

1. `backend/prisma/schema.prisma` を修正
2. `cdk/lib/constructs/document-page-processor.ts` を修正
3. Prisma クライアントを再生成
4. CDK スタックをデプロイ

## リスク評価

1. **パッケージサイズの増加**:
   - Prisma バイナリを含めることでデプロイパッケージのサイズが増加
   - 対策: 必要に応じて Lambda レイヤーを検討

2. **デプロイ時間の増加**:
   - バイナリファイルのコピーによりデプロイ時間が増加する可能性
   - 対策: CI/CD パイプラインでのキャッシュ活用

3. **互換性の問題**:
   - 将来の Prisma バージョンアップで設定が変わる可能性
   - 対策: バージョンアップ時に設定を確認

## 検証方法

1. 修正後に CDK スタックをデプロイ
2. Step Functions の実行をトリガー
3. CloudWatch Logs でエラーが解消されたことを確認
4. 正常にデータベースにデータが保存されることを確認

## 参考資料

- [Prisma Documentation - Binary Targets](https://www.prisma.io/docs/concepts/components/prisma-engines#binary-targets)
- [AWS Samples - Prisma Lambda CDK](https://github.com/aws-samples/prisma-lambda-cdk)
- [Prisma Issue - Lambda Deployment](https://github.com/prisma/prisma/issues/4703)
