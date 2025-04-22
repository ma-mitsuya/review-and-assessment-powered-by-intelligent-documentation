{
"Error": "Runtime.UnhandledPromiseRejection",
"Cause": "{\"errorType\":\"Runtime.UnhandledPromiseRejection\",\"errorMessage\":\"PrismaClientInitializationError: Prisma Client could not locate the Query Engine for runtime \\\"rhel-openssl-3.0.x\\\".\\n\\nThis is likely caused by a bundler that has not copied \\\"libquery_engine-rhel-openssl-3.0.x.so.node\\\" next to the resulting bundle.\\nEnsure that \\\"libquery_engine-rhel-openssl-3.0.x.so.node\\\" has been copied next to the bundle or in \\\"node_modules/.prisma/client\\\".\\n\\nWe would appreciate if you could take the time to share some information with us.\\nPlease help us by answering a few questions: https://pris.ly/engine-not-found-bundler-investigation\\n\\nThe following locations have been searched:\\n /var/task/node_modules/.prisma/client\\n /var\\n /Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/node_modules/@prisma/client\\n /.prisma/client\\n /tmp/prisma-engines\",\"trace\":[\"Runtime.UnhandledPromiseRejection: PrismaClientInitializationError: Prisma Client could not locate the Query Engine for runtime \\\"rhel-openssl-3.0.x\\\".\",\"\",\"This is likely caused by a bundler that has not copied \\\"libquery_engine-rhel-openssl-3.0.x.so.node\\\" next to the resulting bundle.\",\"Ensure that \\\"libquery_engine-rhel-openssl-3.0.x.so.node\\\" has been copied next to the bundle or in \\\"node_modules/.prisma/client\\\".\",\"\",\"We would appreciate if you could take the time to share some information with us.\",\"Please help us by answering a few questions: https://pris.ly/engine-not-found-bundler-investigation\",\"\",\"The following locations have been searched:\",\" /var/task/node_modules/.prisma/client\",\" /var\",\" /Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/node_modules/@prisma/client\",\" /.prisma/client\",\" /tmp/prisma-engines\",\" at process.<anonymous> (file:///var/runtime/index.mjs:1276:17)\",\" at process.emit (node:events:518:28)\",\" at emitUnhandledRejection (node:internal/process/promises:252:13)\",\" at throwUnhandledRejectionsMode (node:internal/process/promises:388:19)\",\" at processPromiseRejections (node:internal/process/promises:475:17)\",\" at process.processTicksAndRejections (node:internal/process/task_queues:106:32)\"]}"
}
どのようにエラーを解消すべきか？

ChatGPT said:

Thought for 25 seconds
以下のエラーは 「Query Engine  バイナリが  AWS Lambda の実行環境（rhel‑openssl‑3.0.x）に見つからない」 ことが原因です。主に  ① 生成時に適切な  binaryTarget を指定していない、② バンドラ／デプロイ時に  .so.node  バイナリを含めていない、のどちらか（または両方）で発生します。
修正手順を順番に確認してください。

1. Prisma  のバージョンを確認
OpenSSL 3.0  系をサポートするのは  v3.13.0  以降です。まずローカルで:

bash
Copy
Edit
npx prisma -v
バージョンが古い場合はアップグレードします。

bash
Copy
Edit
npm i prisma@latest @prisma/client@latest
（OpenSSL 3.0  対応は  3.13+ 以降）
Stack Overflow

2. schema.prisma に正しい  binaryTargets  を追加
Node.js 20/22  ランタイム（Amazon Linux 2023）は  rhel‑openssl‑3.0.x が正解です。
Node.js 18  以前は  rhel‑openssl‑1.0.x。
Prisma

prisma
Copy
Edit
generator client {
provider = "prisma-client-js"
binaryTargets = ["native", "rhel-openssl-3.0.x"] // Lambda 用
}
保存後に必ず再生成：

bash
Copy
Edit
npx prisma generate
native はローカル開発用、rhel‑openssl‑3.0.x が本番（Lambda）用です。
Prisma
Netlify Support Forums

3.  バンドラ／デプロイで  .prisma  フォルダを欠落させない
esbuild / Webpack / サーバレス Framework を使う場合
外部化する

ts
Copy
Edit
// esbuild 設定例
external: ['@prisma/client', '.prisma/client/libquery_engine-rhel-openssl-3.0.x.so.node']
patterns でコピーする（Serverless Framework + esbuild の場合）

yml
Copy
Edit
package:
patterns: - '!node_modules/.prisma/**' - 'node_modules/.prisma/client/**'
バンドラが  .so.node  を除外しやすいので明示的に含めます。
Netlify Support Forums
GitHub

代替案：Lambda Layer に分離
.prisma/client  を Layer に置き、関数コードから通常通り  @prisma/client  を import しても動作します。
Reddit

4.  デプロイ後に動作確認
Lambda 内で次を実行し、バイナリが存在するかを確認：

bash
Copy
Edit
ls -R /var/task/node_modules/.prisma/client | grep rhel-openssl-3.0.x
出力が空なら、ステップ  3  でバンドルに含まれていません。
Netlify / Vercel / Render など他サービスでも同様に “バイナリがコピーされていない” 例が多数報告されています。
GitHub
Netlify Support Forums

5.  追加のチェックポイント

チェック項目 説明
prisma generate を CI で実行 npm ci → prisma generate をビルド手順に含める
PRISMA_QUERY_ENGINE_LIBRARY どうしてもコピーできない場合、環境変数で明示的に  .so  の絶対パスを渡せます。
GitHub
Stack Overflow
Data Proxy / Accelerate バイナリを配布せず HTTP 経由で接続できるため、バンドル問題を根本的に回避可能（ただし追加コストあり）。
Prisma
まとめ
Prisma  を最新に更新し、schema.prisma に rhel-openssl-3.0.x を追加して再生成。

.prisma/client  ディレクトリと  libquery_engine‑rhel‑openssl‑3.0.x.so.node  を Lambda パッケージ（または Layer）に必ず含める。

ビルド／CI で prisma generate を忘れずに実行。

この 3 点を守れば、PrismaClientInitializationError: … could not locate the Query Engine は解消できます。

Sources

You said:
https://github.com/aws-samples/prisma-lambda-cdk
このサイトもクロールして考えてみて
ちなみに僕は今 Lambda 使っています

ChatGPT said:

Thought for 58 seconds
以下に  「OpenSSL 3  版エンジンが見つからない」  エラーを  AWS Lambda で解消するための実践的チェックリストをまとめました。
公式サンプル  [aws‑samples/prisma‑lambda‑cdk]  の実装を取り込み、CDK + NodejsFunction（ZIP）  と Docker Image Lambda  の両方で確実に  Prisma  エンジンをパッケージする方法を示します。

1.  エラーの本質
Lambda (Node 20/22) では OpenSSL 3.0  版 (rhel‑openssl‑3.0.x) の Query Engine が必須。見つからない場合に PrismaClientInitializationError が発生します。​
GitHub

Netlify/Lambda などでも同様の議論があり、バンドラが  .so.node  ファイルを ZIP から落としている ケースが大半です。​
GitHub

2. Prisma  の準備
最新版に更新（v3.13+ で OpenSSL 3 対応）。

schema.prisma に最低でも次を追加（開発環境は  native）：

prisma
Copy
Edit
generator client {
provider = "prisma-client-js"
binaryTargets = ["native", "rhel-openssl-3.0.x"]
}

```:contentReference[oaicite:2]{index=2}
npx prisma generate を CI/ビルド段階で必ず実行する。​
Prisma

3. CDK + NodejsFunction（ZIP バンドル）での対策
公式サンプルの PrismaFunction クラスでは ―

nodeModules に prisma と @prisma/client を明示；これにより esbuild が依存モジュールを外部に配置。​
GitHub

commandHooks.beforeInstall で prisma ディレクトリを ZIP にコピー。これが無いとエンジンが同梱されません。​
GitHub

ts
Copy
Edit
bundling: {
  nodeModules: ['prisma', '@prisma/client'],
  commandHooks: {
    beforeInstall: (i, o) => [`cp -r ${i}/prisma ${o}`],
  },
},
サンプルではこのクラスを Nodejs 20 ランタイムで使い、正常に起動しています。​
GitHub

あなたの CDK スタックにも同じ bundling オプションを適用すれば、libquery_engine‑rhel‑openssl‑3.0.x.so.node が /var/task/node_modules/.prisma/client に入ります。

4. Docker Image Lambda による簡易パッケージ
ZIP が複雑なら、同リポジトリの DockerPrismaFunction を流用するのが最短です。​
GitHub

Dockerfile 内で単に npm ci && npx prisma generate を走らせるだけで、正しいバイナリがイメージに入る。

CDK 側では DockerImageCode.fromImageAsset('./backend') を指定するだけ。​
GitHub

5. 追加オプション

シナリオ	推奨設定
マルチ OS ビルド (GitHub Actions + Lambda)	PRISMA_CLI_BINARY_TARGETS="debian-openssl-1.1.x,rhel-openssl-3.0.x" を環境変数に設定。​
GitHub
CI 上で Engine が要らない	--data-proxy を使って Prisma Accelerate / Data Proxy に切替え、バイナリ配送を回避。​
Prisma
Layer に分離	.prisma/client だけを Lambda Layer に置き、関数コードから通常どおり @prisma/client を import。パッケージサイズを抑制可能。​
GitHub
接続プール問題	?pool_timeout=20&connect_timeout=20 のようにクエリパラメータで調整（サンプルで実装済）。​
GitHub
6. デプロイ前チェックリスト
node_modules/.prisma/client/libquery_engine-rhel-openssl-3.0.x.so.node が ZIP/イメージ内に存在

bash
Copy
Edit
unzip -l function.zip | grep rhel-openssl
AWS_LAMBDA_JS_RUNTIME（Netlify 等）が Node20 なら OpenSSL 3 ターゲットを含むか確認。​
GitHub

VPC 内の DB に接続する場合は RDS Proxy も検討。​
GitHub

まとめ
Prisma 側：最新版＋binaryTargets = ["native", "rhel-openssl-3.0.x"]、prisma generate を忘れない。

ビルド側：prisma ディレクトリと @prisma/client を 必ず ZIP/イメージに含める（NodejsFunction なら commandHooks、Docker なら単純に npm ci）。

動作確認：Lambda で ls /var/task/node_modules/.prisma/client を実行し、エンジンが入っていることを確認。

これで Prisma Client could not locate the Query Engine for runtime "rhel-openssl-3.0.x" は解消できます。




Sources
```
