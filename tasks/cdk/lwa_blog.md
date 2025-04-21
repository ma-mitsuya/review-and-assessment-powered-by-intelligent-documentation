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
