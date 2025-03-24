# AWS Lambda Web Adapter

A tool to run web applications on AWS Lambda

AWS Lambda Web Adapter allows developers to build web apps (http api) with familiar frameworks (e.g. Express.js, Next.js, Flask, SpringBoot, ASP.NET and Laravel, anything speaks HTTP 1.1/1.0) and run it on AWS Lambda.
The same docker image can run on AWS Lambda, Amazon EC2, AWS Fargate, and local computers.

![Lambda Web Adapter](docs/images/lambda-adapter-overview.png)

## Features

- Run web applications on AWS Lambda
- Supports Amazon API Gateway Rest API and Http API endpoints, Lambda Function URLs, and Application Load Balancer
- Supports Lambda managed runtimes, custom runtimes and docker OCI images
- Supports any web frameworks and languages, no new code dependency to include
- Automatic encode binary response
- Enables graceful shutdown
- Supports response payload compression
- Supports response streaming
- Supports non-http event triggers

## Usage

AWS Lambda Web Adapter work with Lambda functions packaged as both docker images and Zip packages.

### Lambda functions packaged as Docker Images or OCI Images

To use Lambda Web Adapter with docker images, package your web app (http api) in a Dockerfile, and add one line to copy Lambda Web Adapter binary to /opt/extensions inside your container:

```dockerfile
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.9.0 /lambda-adapter /opt/extensions/lambda-adapter
```

[Non-AWS base images](https://docs.aws.amazon.com/lambda/latest/dg/images-create.html) may be used since the [Runtime Interface Client](https://docs.aws.amazon.com/lambda/latest/dg/images-create.html#images-ric) ships with the Lambda Web Adapter.

By default, Lambda Web Adapter assumes the web app is listening on port 8080. If not, you can specify the port via [configuration](#configurations).

Pre-compiled Lambda Web Adapter binaries are provided in ECR public repo: [public.ecr.aws/awsguru/aws-lambda-adapter](https://gallery.ecr.aws/awsguru/aws-lambda-adapter).
Multi-arch images are also provided in this repo. It works on both x86_64 and arm64 CPU architecture.

Below is a Dockerfile for [an example nodejs application](examples/expressjs).

```dockerfile
FROM public.ecr.aws/docker/library/node:20-slim
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.9.0 /lambda-adapter /opt/extensions/lambda-adapter
ENV PORT=7000
WORKDIR "/var/task"
ADD src/package.json /var/task/package.json
ADD src/package-lock.json /var/task/package-lock.json
RUN npm install --omit=dev
ADD src/ /var/task
CMD ["node", "index.js"]
```

This works with any base images except AWS managed base images. To use AWS managed base images, you need to override the ENTRYPOINT to start your web app.

### Lambda functions packaged as Zip package for AWS managed runtimes

AWS Lambda Web Adapter also works with AWS managed Lambda runtimes. You need to do three things:

1. attach Lambda Web Adapter layer to your function.

   #### AWS Commercial Regions

   1. x86_64: `arn:aws:lambda:${AWS::Region}:753240598075:layer:LambdaAdapterLayerX86:24`
   2. arm64: `arn:aws:lambda:${AWS::Region}:753240598075:layer:LambdaAdapterLayerArm64:24`

   #### AWS China Regions

   1. cn-north-1 (Beijing)
      - x86_64: `arn:aws-cn:lambda:cn-north-1:041581134020:layer:LambdaAdapterLayerX86:24`
   2. cn-northwest-1 (Ningxia)
      - x86_64: `arn:aws-cn:lambda:cn-northwest-1:069767869989:layer:LambdaAdapterLayerX86:24`

2. configure Lambda environment variable `AWS_LAMBDA_EXEC_WRAPPER` to `/opt/bootstrap`.
3. set function handler to your web application start up script. e.g. `run.sh`.

For details, please check out [the example Node.js application](examples/expressjs-zip).

## Readiness Check

When a new Lambda Execution Environment starts up, Lambda Web Adapter will boot up as a Lambda Extension, followed by the web application.

By default, Lambda Web Adapter will send HTTP GET requests to the web application at `http://127.0.0.1:8080/`. The port and path can be customized with two environment variables: `AWS_LWA_READINESS_CHECK_PORT` and `AWS_LWA_READINESS_CHECK_PATH`.

Lambda Web Adapter will retry this request every 10 milliseconds until the web application returns an HTTP response (**status code >= 100 and < 500**) or the function times out.

In addition, you can configure the adapter to preform readiness check with TCP connect, by setting `AWS_LWA_READINESS_CHECK_PROTOCOL` to `tcp`.

After passing readiness check, Lambda Web Adapter will start Lambda Runtime and forward the invokes to the web application.

## Configurations

The readiness check port/path and traffic port can be configured using environment variables. These environment variables can be defined either within docker file or as Lambda function configuration.

| Environment Variable                                          | Description                                                                                                   | Default    |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------- |
| AWS_LWA_PORT / PORT\*                                         | traffic port                                                                                                  | "8080"     |
| AWS_LWA_READINESS_CHECK_PORT / READINESS_CHECK_PORT\*         | readiness check port, default to the traffic port                                                             | PORT       |
| AWS_LWA_READINESS_CHECK_PATH / READINESS_CHECK_PATH\*         | readiness check path                                                                                          | "/"        |
| AWS_LWA_READINESS_CHECK_PROTOCOL / READINESS_CHECK_PROTOCOL\* | readiness check protocol: "http" or "tcp", default is "http"                                                  | "http"     |
| AWS_LWA_READINESS_CHECK_MIN_UNHEALTHY_STATUS                  | The minimum HTTP status code that is considered unhealthy                                                     | "500"      |
| AWS_LWA_ASYNC_INIT / ASYNC_INIT\*                             | enable asynchronous initialization for long initialization functions                                          | "false"    |
| AWS_LWA_REMOVE_BASE_PATH / REMOVE_BASE_PATH\*                 | the base path to be removed from request path                                                                 | None       |
| AWS_LWA_ENABLE_COMPRESSION                                    | enable gzip compression for response body                                                                     | "false"    |
| AWS_LWA_INVOKE_MODE                                           | Lambda function invoke mode: "buffered" or "response_stream", default is "buffered"                           | "buffered" |
| AWS_LWA_PASS_THROUGH_PATH                                     | the path for receiving event payloads that are passed through from non-http triggers                          | "/events"  |
| AWS_LWA_AUTHORIZATION_SOURCE                                  | a header name to be replaced to `Authorization`                                                               | None       |
| AWS_LWA_ERROR_STATUS_CODES                                    | comma-separated list of HTTP status codes that will cause Lambda invocations to fail (e.g. "500,502-504,422") | None       |

> **Note:**
> We use "AWS*LWA*" prefix to namespacing all environment variables used by Lambda Web Adapter. The original ones will be supported until we reach version 1.0.

**AWS_LWA_PORT / PORT** - Lambda Web Adapter will send traffic to this port. This is the port your web application listening on. Inside Lambda execution environment,
the web application runs as a non-root user, and not allowed to listen on ports lower than 1024. Please also avoid port 9001 and 3000.
Lambda Runtime API is on port 9001. CloudWatch Lambda Insight extension uses port 3000.

**AWS_LWA_ASYNC_INIT / ASYNC_INIT** - Lambda managed runtimes offer up to 10 seconds for function initialization. During this period of time, Lambda functions have burst of CPU to accelerate initialization, and it is free.
If a lambda function couldn't complete the initialization within 10 seconds, Lambda will restart the function, and bill for the initialization.
To help functions to use this 10 seconds free initialization time and avoid the restart, Lambda Web Adapter supports asynchronous initialization.
When this feature is enabled, Lambda Web Adapter performs readiness check up to 9.8 seconds. If the web app is not ready by then,
Lambda Web Adapter signals to Lambda service that the init is completed, and continues readiness check in the handler.
This feature is disabled by default. Enable it by setting environment variable `AWS_LWA_ASYNC_INIT` to `true`.

**AWS_LWA_REMOVE_BASE_PATH / REMOVE_BASE_PATH** - The value of this environment variable tells the adapter whether the application is running under a base path.
For example, you could have configured your API Gateway to have a /orders/{proxy+} and a /catalog/{proxy+} resource.
Each resource is handled by a separate Lambda functions. For this reason, the application inside Lambda may not be aware of the fact that the /orders path exists.
Use REMOVE_BASE_PATH to remove the /orders prefix when routing requests to the application. Defaults to empty string. Checkout [SpringBoot](examples/springboot) example.

**AWS_LWA_ENABLE_COMPRESSION** - Lambda Web Adapter supports gzip compression for response body. This feature is disabled by default. Enable it by setting environment variable `AWS_LWA_ENABLE_COMPRESSION` to `true`.
When enabled, this will compress responses unless it's an image as determined by the content-type starting with `image` or the response is less than 32 bytes. This will also compress HTTP/1.1 chunked streaming response.

**AWS_LWA_INVOKE_MODE** - Lambda function invoke mode, this should match Function Url invoke mode. The default is "buffered". When configured as "response_stream", Lambda Web Adapter will stream response to Lambda service [blog](https://aws.amazon.com/blogs/compute/introducing-aws-lambda-response-streaming/).
Please check out [FastAPI with Response Streaming](examples/fastapi-response-streaming) example.

**AWS_LWA_READINESS_CHECK_MIN_UNHEALTHY_STATUS** - allows you to customize which HTTP status codes are considered healthy and which ones are not

**AWS_LWA_PASS_THROUGH_PATH** - Path to receive events payloads passed through from non-http event triggers. The default is "/events".

**AWS_LWA_AUTHORIZATION_SOURCE** - When set, Lambda Web Adapter replaces the specified header name to `Authorization` before proxying a request. This is useful when you use Lambda function URL with [IAM auth type](https://docs.aws.amazon.com/lambda/latest/dg/urls-auth.html), which reserves Authorization header for IAM authentication, but you want to still use Authorization header for your backend apps. This feature is disabled by default.

**AWS_LWA_ERROR_STATUS_CODES** - A comma-separated list of HTTP status codes that will cause Lambda invocations to fail. Supports individual codes and ranges (e.g. "500,502-504,422"). When the web application returns any of these status codes, the Lambda invocation will fail and trigger error handling behaviors like retries or DLQ processing. This is useful for treating certain HTTP errors as Lambda execution failures. This feature is disabled by default.

## Request Context

**Request Context** is metadata API Gateway sends to Lambda for a request. It usually contains requestId, requestTime, apiId, identity, and authorizer. Identity and authorizer are useful to get client identity for authorization. API Gateway Developer Guide contains more details [here](https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format).

Lambda Web Adapter forwards this information to the web application in a Http Header named "x-amzn-request-context". In the web application, you can retrieve the value of this http header and deserialize it into a JSON object. Check out [Express.js in Zip](examples/expressjs-zip) on how to use it.

## Lambda Context

**Lambda Context** is an object that Lambda passes to the function handler. This object provides information about the invocation, function, and execution environment. You can find a full list of properties accessible through the Lambda Context [here](https://docs.aws.amazon.com/lambda/latest/dg/nodejs-context.html)

Lambda Web Adapter forwards this information to the web application in a Http Header named "x-amzn-lambda-context". In the web application, you can retrieve the value of this http header and deserialize it into a JSON object. Check out [Express.js in Zip](examples/expressjs-zip) on how to use it.

## Graceful Shutdown

For a function with Lambda Extensions registered, Lambda enables shutdown phase for the function. When Lambda service is about to shut down a Lambda execution environment,
it sends a SIGTERM signal to the runtime and then a SHUTDOWN event to each registered external extensions. Developers could catch the SIGTERM signal in the lambda functions and perform graceful shutdown tasks.
The [Express.js](examples/expressjs/app/src/index.js) gives a simple example. More details in [this repo](https://github.com/aws-samples/graceful-shutdown-with-aws-lambda).

## Local Debugging

Lambda Web Adapter allows developers to develop web applications locally with familiar tools and debuggers: just run the web app locally and test it. If you want to simulate Lambda Runtime environment locally, you can use AWS SAM CLI. The following command starts a local api gateway endpoint and simulate the Lambda runtime execution environment.

```bash
sam local start-api
```

Please note that `sam local` starts a Lambda Runtime Interface Emulator on port 8080. So your web application should avoid port `8080` if you plan to use `sam local`.

## Non-HTTP Event Triggers

The Lambda Web Adapter also supports all non-HTTP event triggers, such as SQS, SNS, S3, DynamoDB, Kinesis, Kafka, EventBridge, and Bedrock Agents. The adapter forwards the event payload to the web application via http post to a path defined by the `AWS_LWA_PASS_THROUGH_PATH` environment variable. By default, this path is set to `/events`. Upon receiving the event payload from the request body, the web application should processes it and returns the results as a JSON response. Please checkout [SQS Express.js](examples/sqs-expressjs) and [Bedrock Agent FastAPI in Zip](examples/bedrock-agent-fastapi-zip) examples.

## Examples

- [FastAPI](examples/fastapi)
- [FastAPI in Zip](examples/fastapi-zip)
- [FastAPI with Background Tasks](examples/fastapi-background-tasks)
- [FastAPI with Response Streaming](examples/fastapi-response-streaming)
- [FastAPI with Response Streaming in Zip](examples/fastapi-response-streaming-zip)
- [FastAPI Response Streaming Backend with IAM Auth](examples/fastapi-backend-only-response-streaming/)
- [Flask](examples/flask)
- [Flask in Zip](examples/flask-zip)
- [Serverless Django](https://github.com/aws-hebrew-book/serverless-django) by [@efi-mk](https://github.com/efi-mk)
- [Express.js](examples/expressjs)
- [Express.js in Zip](examples/expressjs-zip)
- [Next.js](examples/nextjs)
- [Next.js in Zip](examples/nextjs-zip)
- [Next.js Response Streaming](examples/nextjs-response-streaming)
- [SpringBoot](examples/springboot)
- [SpringBoot in Zip](examples/springboot-zip)
- [SpringBoot Response Streaming](examples/springboot-response-streaming-zip)
- [Nginx](examples/nginx)
- [PHP](examples/php)
- [Rust Actix Web in Zip](examples/rust-actix-web-zip)
- [Rust Axum in Zip](examples/rust-axum-zip)
- [Golang Gin](examples/gin)
- [Golang Gin in Zip](examples/gin-zip)
- [Deno Oak in Zip](examples/deno-zip)
- [Laravel on Lambda](https://github.com/aws-samples/lambda-laravel)
- [ASP.NET MVC](examples/aspnet-mvc)
- [ASP.NET MVC in Zip](examples/aspnet-mvc-zip)
- [ASP.NET Web API in Zip](examples/aspnet-webapi-zip)
- [SQS Express.js](examples/sqs-expressjs)
- [Bedrock Agent FastAPI](examples/bedrock-agent-fastapi)
- [Bedrock Agent FastAPI in Zip](examples/bedrock-agent-fastapi-zip)
- [FastHTML](examples/fasthtml)
- [FastHTML in Zip](examples/fasthtml-zip)
- [FastHTML with Response Streaming](examples/fasthtml-response-streaming)
- [FastHTML with Response Streaming in Zip](examples/fasthtml-response-streaming-zip)
- [Remix](examples/remix/)
- [Remix in Zip](examples/remix-zip/)
- [Sveltekit SSR Zip](examples/sveltekit-ssr-zip/)

## Acknowledgement

This project was inspired by several community projects.

- [re:Web](https://github.com/apparentorder/reweb)
- [Serverlessish](https://github.com/glassechidna/serverlessish)

## Similar Projects

Several projects also provide similar capabilities as language specific packages/frameworks.

- [Serverless Java Container](https://github.com/awslabs/aws-serverless-java-container)
- [Serverless Express](https://github.com/vendia/serverless-express)
- [Serverless Python - Zappa](https://github.com/zappa/Zappa)
- [Serverless Rails - Lamby](https://github.com/customink/lamby)
- [Serverless PHP - Bref](https://github.com/brefphp/bref)

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This project is licensed under the Apache-2.0 License.

## ブログ

Lambda Web Adapter でウェブアプリを (ほぼ) そのままサーバーレス化する
(2025 年改訂版)

2025-03-18
デベロッパーのためのクラウド活用方法
Author : 友岡 雅志

ツイート »
シェア »
はてブ »
開発者の皆さまこんにちは！AWS Japan で Prototyping Engineer として働いている友岡です。

今日は AWS Lambda Web Adapter (LWA) というソリューションをご紹介します。VM やコンテナ用に実装されたウェブアプリを、ほとんどそのまま Lambda でも動かせるようにするツールです。(なお、ここで言うウェブアプリとは HTTP を話す任意のウェブサーバーアプリを指します。)

日本の AWS 技術陣によるベストプラクティスを毎月無料で試すことができます
builders.flash メールメンバー登録で、毎月の最新アップデート情報とともに、AWS を無料でお試しいただけるクレジットコードを受け取ることができます。

今すぐ登録  
背景
Lambda を初めて触る方がまず戸惑うのが、実行方法が Lambda 特有のものになることではないでしょうか。以下は TypeScript の例ですが、Lambda アプリケーションは基本的にこのようなインターフェースの関数 (ハンドラー) を実行する形になり、また外部からの入力はハンドラーの第 1 引数 event として渡されます。

export const handler = async (event, context) => {
// ここに処理を記述
}

コピー
この形式のため、既存のフレームワークをどう組み込めば良いかパッとわからない場合もあるでしょう。例えば Node.js でよく使われる Express.js では、本来は以下のようなエントリポイントを書いて動かします (Express の Hello world より)。

const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) => {
res.send('Hello World!')
})

app.listen(port, () => {
console.log(`Example app listening on port ${port}`)
})

コピー
しかし、このコードをそのまま Lambda のハンドラー関数内に書いても Express アプリは動作しません ! これは Lambda が必要とする入出力インターフェースと全く異なるためです。

Express を Lambda 上で正しく動作させるためには、serverless-express というライブラリを使うのが 1 つの方法です。これは Express と Lambda 間の入出力を適切に変換するアダプターのような働きをします。ただしこれも万能の解決策ではなく、以下の欠点も考えられます。

Express.js や Fastify など、ライブラリごとに別々のアダプターを用意する必要がある
物によっては同様のアダプターが巷に存在せず、すぐに Lambda 上で動かすのが困難な場合がある
ビルドしたアーティファクト (コンテナイメージや js ファイルなど) は基本的には Lambda 上でしか動かせない
今回紹介する Lambda Web Adapter (以下 LWA と呼びます) では、上記の問題を解消することができます ! この方法ならフレームワークによらず任意のウェブアプリを Lambda で動かすことができます。LWA は AWS が公式に提供する OSS です。

GItHub リポジトリはこちら »

使い方
百聞は一見にしかずということで、まずは使い方を説明させてください。

前提として、すでに Amazon ECS やローカル環境用に動いているウェブアプリの Dockerfile が存在すると仮定します。もし既存アプリが Docker でない場合は、こちらのドキュメント もご覧ください。このとき LWA の導入方法は非常に簡単で、お手持ちの Dockerfile に以下の 1 行を追加するだけです !

COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.9.0 /lambda-adapter /opt/extensions/lambda-adapter

コピー
この COPY コマンド 1 つでインストールは完了していて、この Dockerfile をそのまま Lambda のコンテナランタイム で動かすことができます。

最終的には、Dockerfile はこのようなものになるでしょう (Node.js express アプリの例)。あとは AWS CDK などお好きなツールを使ってこちらの Dockerfile を Lambda にデプロイし、Amazon API Gateway や Lambda Function URL を通してサービスを公開すれば良いわけです。アプリの実装はそのままで !

FROM node:22

# この 1 行を追加するだけ！

COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.9.0 /lambda-adapter /opt/extensions/lambda-adapter

# あとは従来どおり

WORKDIR /usr/src/app
COPY package\*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 8080
CMD [ "node", "server.js" ]

コピー
見ての通り、Dockerfile への変更は /opt/extensions/ にファイルを追加しているだけです。このため、このコンテナイメージはそのままローカルでも Amazon ECS でも Lambda でも動作します。LWA を使うことで、デプロイするアーティファクトを移植しやすくポータブルに保つことができるのです !
また上記の Dockerfile は Node.js の例ですが、他の言語やフレームワークでも同様に動作します。これは次節で説明する LWA の仕組みを見れば納得できるでしょう。

補足 : なお、実利用時には特に以下の環境変数も追加で設定する必要があるかもしれません。

AWS_LWA_PORT : Web アプリが Listen しているポート番号 (デフォルト = 8080)
AWS_LWA_READINESS_CHECK_PATH : Web サーバーの起動確認をするための API エンドポイントのパス (デフォルト = /)
他にも LWA の設定のためいくつかの環境変数が用意されています。詳細は ドキュメント をご覧ください。

バージョンは例として aws-lambda-adapter:0.9.0 としていますが、実際はその時点での最新版を使うのがおすすめです。最新バージョンは GitHub のリリースページ をご覧ください。

仕組み
なぜ先程のような少ない変更で動作するのでしょうか。一言で言えば、LWA は Lambda Extension の仕組みを使っているためです。Lambda ランタイムは /opt/extensions/ ディレクトリを確認し、ファイルがあれば Lambda Extension として実行します。このため、Dockerfile に COPY コマンドを書くだけで LWA のインストールは完了しています。

Lambda に統合された API Gateway や ALB がリクエストを受信した際、下図の流れで処理されます。図中の番号に沿って説明します。
Lambda ランタイムが統合先 (API Gateway, ALB など) からイベントを受信します。
イベントは Lambda Extension である LWA により処理されます。
LWA はイベントをパース･HTTP リクエストに変換し、ウェブアプリのプロセスに HTTP で転送します。
ウェブアプリのプロセスは HTTP で受信したリクエストを処理し、HTTP でレスポンスを返します。これにより、ウェブアプリは Lambda を意識せず従来のコードのまま動作すればよいのです。
LWA は受け取ったレスポンスを API Gateway が期待する形式に変換し、Lambda ランタイムに返します。
Lambda ランタイムは統合先にレスポンスを返します。

Lambda Extension の API は、このように本来の Lambda の処理に介入するようなことを可能にするのです。詳細は こちらのドキュメント もご覧ください。

LWA の実際のコード(2022 年時点) も少し見てみましょう。LWA は Rust 言語で書かれています。Lambda のイベントから HTTP リクエストを作り、得られたレスポンスを Lambda の形式に変換している様子が見て取れますね。

注 : 2025 年現在では、多くの処理が外部ライブラリ (lambda_http など) に委譲される形へリファクタされています。

async fn fetch_response(
async_init: bool,
ready_at_init: Arc<AtomicBool>,
client: Arc<Client>,
base_path: Option<String>,
domain: Url,
healthcheck_url: Url,
healthcheck_protocol: Protocol,
event: Request,
) -> Result<Response<Body>, Error> {
// ...(中略)

    // ウェブアプリのプロセスにリクエストを転送
    let app_response = client
        .request(parts.method, app_url.to_string())
        .headers(req_headers)
        .body(body.to_vec())
        .send()
        .await?;

    // ...(中略)

    // レスポンスをLambdaのレスポンス形式に変換
    let mut lambda_response = Response::builder();
    if let Some(headers) = lambda_response.headers_mut() {
        let _ = mem::replace(headers, app_headers);
    }
    let resp = lambda_response.status(status).body(body).map_err(Box::new)?;

    Ok(resp)

}

コピー
上記の仕組みを念頭に考えれば、LWA が言語やフレームワークによらず、HTTP を話す任意のアプリで同様に動作することが分かるでしょう。

対応している Web サーバーフレームワーク
原理上は、HTTP を話す任意の Web アプリフレームワークが動作するかと思います。ぜひお試しください。公式の実装例では、以下のフレームワークが掲載されています。 (2022/11 現在)

Python : FastAPI, Flask
Node.js : Express.js, Next.js
Java : SpringBoot
Rust : Axum
Go : Gin
また、Lambda 実行環境特有の事情として Lambda 実行環境のライフサイクル のお話があります。詳細はドキュメントを参照いただければと思いますが、リクエストの処理外で動くバックグラウンド処理やコールバックは意図通りに動作しなくなる可能性もあります。とはいえアプリの実装次第です。先述の通り Dockerfile に 1 行追加すれば良いだけなので、ぜひお試しください。

性能面はどうなの ?
Lambda Web Adapter は非常に簡単に導入できることが分かりました。さて、気になるのは性能面のトレードオフです。簡単に Lambda に載せることが可能な一方で、リクエストの処理速度が劣化したりしないでしょうか ?

今回は実際に Lambda を同時実行数 1,000 程度になる量の HTTP リクエストを一定期間送り続け、コールドスタート時間とリクエスト処理時間を計測することにしました。計測結果は以下の 3 通りの場合で比較してみます:

serverless-express を使用する場合 (Node.js ランタイム)
serverless-express を使用する場合 (コンテナランタイム)
Lambda Web Adapter を使用する場合 (コンテナランタイム)
上記 3 つに対してそれぞれ Amazon API Gateway HTTP API を統合し、作成された HTTP エンドポイントに対して負荷試験ツールで以下の負荷を掛けました。負荷ツールは同一リージョンに Locust をデプロイしています (Distributed Load Testing with Locust on Amazon ECS)。

負荷パターン : 10 秒間で徐々に負荷を上げ、約 3 分間一定の負荷を保ち続ける
最大同時接続数 (負荷) : 1,000
リージョン : us-east-1 (北ヴァージニア, ベンチマーク対象の Lambda と同じリージョン)
なお、検証に用いた Express アプリの実装は以下のとおりで、ただ Hello の文字列を返す単純なものです (コードは下記)。 一点、リクエストレートが API Gateway のデフォルトクォータ (10,000 RPS) を超過することを防ぐため、意図的に 200 ms のスリープを入れました。これにより、同時実行数 1,000 のときは高々 5,000 RPS にとどまります。以降のリクエスト処理時間の値には、この 200 ms が暗黙的に含まれていることに注意してください。本来の処理時間はそれらから 200 を引いた値と考えて良いでしょう。

import express from 'express';
import { setTimeout } from 'timers/promises';

const app = express();

app.get('/', async (\_, res) => {
await setTimeout(200);
res.send('Hello');
});

コピー
その他詳細な条件は、再現するための CDK コードを公開しておりますので、こちらのリポジトリ をご覧ください。

Lambda は呼び出された際に以下のログを残しますが、今回はこのログを使って集計を行います。

REPORT RequestId: 535c99b3-1bc6-48d4-8c22-1f507d3cd28b Duration: 285.20 ms
Billed Duration: 286 ms Memory Size: 128 MB Max Memory Used: 68 MB Init Duration: 206.40 ms

コピー
集計には Amazon CloudWatch Logs Insights を利用できます。以下のクエリを発行することで、実行時間に関する統計値をすべて取得できます。Logs Insights で利用可能な集計関数は、こちらのドキュメント もご覧ください。

stats count(@initDuration), count(@duration),
avg(@initDuration), pct(@initDuration, 99), max(@initDuration), min(@initDuration), stddev(@initDuration),
avg(@duration), pct(@duration, 99), max(@duration), min(@duration), stddev(@duration)
| filter @message like /^REPORT/

コピー
それでは、結果を比べてみましょう。なお、コンテナランタイムの Lambda は何度か負荷走行を繰り返すにつれてコールドスタート時間のばらつき (標準偏差) が小さくなる傾向がありました。この挙動には、コンテナ Lambda のイメージキャッシュを管理する仕組みが関連していると思われます。詳細は こちらの動画 や ブログ記事 もご覧ください。

今回はより現実的な状況に近づけるため、何度か負荷走行を繰り返した後、コールドスタート時間の偏差が概ね収束したケースを掲載しています。ばらつきを小さくするためには、ベースイメージを他の Lambda ユーザーがよく使うものにする (amazon/aws-lambda-nodejs など) ことが有効かもしれません。

※ これらはあくまでも参考値です。実際にご利用の際は、実ワークロードでの値をご自身で計測されることを推奨します。

1. Node.js 2. Docker 3. LWA
   レイテンシ AVG (ms) 203.8 203.8 204.6
   レイテンシ P99 (ms) 221.7 222.6 226.1
   レイテンシ
   標準偏差 (ms) 9.3 9.3 7.6
   Cold start AVG (ms) 226.7 306.9 279
   Cold start P99 (ms) 295.6 467.7 441.4
   Cold start 標準偏差 (ms) 17.7 43.1 38.3
   リクエスト件数 800786 811374 787893
   Cold start 件数 1000 1000 1000
   上記のデータから、少なくとも今回の検証においては次のことが言えるでしょう:

レイテンシーはほぼ差がありません。平均レイテンシーは +0.8 ms 程度、p99 でも +4 ms 程度です。
LWA が間に挟まる以上多少レイテンシーは増加しますが、多くのワークロードでは許容できる程度の値だと思われます。
Lambda MicroVM 内で TCP 通信する程度であれば、大きなオーバーヘッドはないのでしょう。
コールドスタート時間はコンテナランタイムを起因とする増加 (3 vs 1) はありますが、LWA 起因の増加分 (3 vs 2) は見られませんでした。ばらつきもありますが、2 と 3 の間ではほぼ同等の時間です。
LWA は 10 ms ごとにヘルスチェックを実行している (2022/11 現在の実装) ため、Express のように軽量なフレームワークであれば十分高速に起動確認でき、Lambda 処理を開始できる状態に到達するのでしょう。
また、LWA 自体も Rust で書かれた小さなバイナリのソフトウェアなので、実行時間への寄与は少ないものと考えられます。

今回は Express を例に考えているので現実的には serverless-express が十分良い選択肢になるとは思いますが、一方で LWA も比較検討する価値はあるとご理解いただければ幸いです。またさらに性能を追求したい方は、Lambda レイヤーを用いることでコンテナランタイム以外でも LWA を利用することができるようです。詳細な方法はこちらもご覧ください。

最後に、これらの結果は使う言語やフレームワーク･コンテナのベースイメージなど諸条件により変化しうるため、他のあらゆる条件において上記の結論になるわけではないことはご注意ください。繰り返しになりますが、実際にご利用の際はお客様固有の条件下で改めて実用性の検証をいただくことをおすすめいたします。

LWA を活用するアーキテクチャパターン (2025 年追記)
初版の記事公開から 2 年が経ち、LWA 周辺のエコシステムは大きく進化を遂げています。これに伴い、LWA を最大限活用できる実装パターンとして、下図に示すアーキテクチャを利用できるようになりました。

このアーキテクチャには以下の強みがあります:

Lambda 関数 URL によるレスポンスストリーミングを透過的に利用可能
関数 URL によりタイムアウトは最長 15 分に (vs API Gateway のデフォルト 29 秒)
CloudFront Origin Access Control で関数 URL エンドポイントをセキュアに保護
より詳細は、ServerelessDays Tokyo 2024 での発表資料もご覧ください: AWS Lambda Web Adapter を活用する新しいサーバーレスの実装パターン

活用方法
ここまでで、Lambda Web Adapter の仕組みや使い方、また性能的にも十分実用的であることを確認しました。最後に LWA の活用方法をいくつか考えてみました:

既存のコンテナアプリを Lambda 化することで、アイドル時の利用料金や管理の手間を減らす。Lambda Function URL なども組み合わせれば、最小労力で Web アプリを Lambda にデプロイし、ちょっとしたサービスを提供することができそうです。
コンテナアプリをそのまま安価なサーバーレスで動かすことができ、高いスケーラビリティも確保できます。考え方によっては、AWS App Runner と同じような使い方ができると言えるかもしれません。
従来 Lambda 上で動かすことが困難だった HTTP アプリ、例えば nginx や HAProxy などもサーバーレス化できるようになります。実用性に一考の余地はありますが、技術的にはサーバーレスロードバランサーやサーバーレスリバースプロキシといった活用も考えられるでしょう。
今コンテナで動いている Web アプリをそのまま Lambda 上でも動かし、突発的な負荷を Lambda に逃がすというのはいかがでしょうか。通常コンテナより Lambda の方がスケールアウトが速いため、システムのスパイク耐性をより高めることができるでしょう。
他にも様々な活用方法が考えられると思います。任意の HTTP アプリをサーバーレス化できるという特徴を活かして、ぜひ皆様も考えてみてください !

まとめ
Lambda Web Adapter、上記の通りなかなか実用性の高いツールです。Lambda にアプリを載せるのに苦労していた方は、試してみてはいかがでしょうか。たった 1 行 Dockerfile に追加するだけです !

ちなみに AWS DevDay 2022 でも弊社下川がこちらのツールについて発表されています。この記事では言及しなかった｢そもそも Web アプリフレームワークを Lambda で使うべきか｣という問題にも触れられているので、合わせてご確認ください !

(2025 年追記) LWA の 初期リリース から 3 年以上が経ちますが、LWA は今も継続的にメンテナンスされ、サーバーレスエコシステムにおける価値を発揮し続けています。開発者の皆様もぜひ試してみて、その便利さを体感してください。
