# BEACON (Building & Engineering Approval Compliance Navigator)

BEACON は、不動産業界向けの AI ドキュメント適合性チェックシステムです。マルチモーダル LLM を活用して、申請書類や契約書が規制やチェックリストに適合しているかを自動的に確認します。

## ハイレベルアーキテクチャ

docs/BEACON-real-estate.xml 参照

## バックログ（上から順番に開発）

- [x] チェックリストの作成パイプライン by StepFunctions
- [x] チェックリストデータ構造の設計
- [x] 生成されるチェックリストのサンプルデータ
- [x] データベーススキーマの設計
- [ ] ETL パイプラインの実装
- [ ] バックエンド API の実装
- [ ] フロントエンドの実装

## 残タスク

#### CDK デプロイ失敗原因調査

原因と解決策教えて

cdk deploy --require-approval never
Bundling asset BeaconStack/DocumentProcessor/BackendFunction/Code/Stage...
✘ [ERROR] Could not resolve "pdfjs-dist/build/pdf.worker.entry"

    ../backend/src/handlers/index.ts:24:49:
      24 │ pdfjsLib.GlobalWorkerOptions.workerSrc = require("pdfjs-dist/build/pdf.worker.entry");
         ╵                                                  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

You can mark the path "pdfjs-dist/build/pdf.worker.entry" as external to exclude it from the
bundle, which will remove this error and leave the unresolved path in the bundle. You can also
surround this "require" call with a try/catch block to handle this failure at run-time instead of
bundle-time.

1 error
/Users/tksuzuki/projects/real-estate/aws-summit/beacon/cdk/node_modules/aws-cdk-lib/core/lib/asset-staging.js:2
`),localBundling=options.local?.tryBundle(bundleDir,options),!localBundling){const assetStagingOptions={sourcePath:this.sourcePath,bundleDir,...options};switch(options.bundlingFileAccess){case bundling_1().BundlingFileAccess.VOLUME_COPY:new(asset_staging_1()).AssetBundlingVolumeCopy(assetStagingOptions).run();break;case bundling_1().BundlingFileAccess.BIND_MOUNT:default:new(asset_staging_1()).AssetBundlingBindMount(assetStagingOptions).run();break}}}catch(err){const bundleErrorDir=bundleDir+"-error";throw fs().existsSync(bundleErrorDir)&&fs().removeSync(bundleErrorDir),fs().renameSync(bundleDir,bundleErrorDir),new Error(`Failed to bundle asset ${this.node.path}, bundle output is located at ${bundleErrorDir}: ${err}`)}if(fs_1().FileSystem.isEmpty(bundleDir)){const outputDir=localBundling?bundleDir:AssetStaging.BUNDLING_OUTPUT_DIR;throw new Error(`Bundling did not produce any output. Check that content is written to ${outputDir}.`)}}calculateHash(hashType,bundling,outputDir){if(hashType==assets_1().AssetHashType.CUSTOM||hashType==assets_1().AssetHashType.SOURCE&&bundling){const hash=crypto().createHash("sha256");return hash.update(this.customSourceFingerprint??fs_1().FileSystem.fingerprint(this.sourcePath,this.fingerprintOptions)),bundling&&hash.update(JSON.stringify(bundling,sanitizeHashValue)),hash.digest("hex")}switch(hashType){case assets_1().AssetHashType.SOURCE:return fs_1().FileSystem.fingerprint(this.sourcePath,this.fingerprintOptions);case assets_1().AssetHashType.BUNDLE:case assets_1().AssetHashType.OUTPUT:if(!outputDir)throw new Error(`Cannot use \`${hashType}\` hash type when \`bundling\` is not specified.`);return fs_1().FileSystem.fingerprint(outputDir,this.fingerprintOptions);default:throw new Error("Unknown asset hash type.")}}renderStagedPath(sourcePath,targetPath){return this.hashType!==assets_1().AssetHashType.OUTPUT&&path().dirname(sourcePath)===targetPath&&(targetPath=targetPath+"_noext"),targetPath}}exports.AssetStaging=AssetStaging,_a=JSII_RTTI_SYMBOL_1,AssetStaging[_a]={fqn:"aws-cdk-lib.AssetStaging",version:"2.181.1"},AssetStaging.BUNDLING_INPUT_DIR="/asset-input",AssetStaging.BUNDLING_OUTPUT_DIR="/asset-output",AssetStaging.assetCache=new(cache_1()).Cache;function renderAssetFilename(assetHash,extension=""){return`asset.${assetHash}${extension}`}function determineHashType(assetHashType,customSourceFingerprint){const hashType=customSourceFingerprint?assetHashType??assets_1().AssetHashType.CUSTOM:assetHashType??assets_1().AssetHashType.SOURCE;if(customSourceFingerprint&&hashType!==assets_1().AssetHashType.CUSTOM)throw new Error(`Cannot specify \`${assetHashType}\` for \`assetHashType\` when \`assetHash\` is specified. Use \`CUSTOM\` or leave \`undefined\`.`);if(hashType===assets_1().AssetHashType.CUSTOM&&!customSourceFingerprint)throw new Error("`assetHash` must be specified when `assetHashType` is set to `AssetHashType.CUSTOM`.");return hashType}function calculateCacheKey(props){return crypto().createHash("sha256").update(JSON.stringify(sortObject(props),sanitizeHashValue)).digest("hex")}function sortObject(object){if(typeof object!="object"||object instanceof Array)return object;const ret={};for(const key of Object.keys(object).sort())ret[key]=sortObject(object[key]);return ret}function sanitizeHashValue(key,value){if(key==="PIP_INDEX_URL"||key==="PIP_EXTRA_INDEX_URL")try{let url=new URL(value);if(url.password)return url.password="",url.toString()}catch(e){throw e.name==="TypeError"?new Error(`${key} must be a valid URL, got ${value}.`):e}return value}function findSingleFile(directory,archiveOnly){if(!fs().existsSync(directory))throw new Error(`Directory ${directory} does not exist.`);if(!fs().statSync(directory).isDirectory())throw new Error(`${directory} is not a directory.`);const content=fs().readdirSync(directory);if(content.length===1){const file=path().join(directory,content[0]),extension=getExtension(content[0]).toLowerCase();if(fs().statSync(file).isFile()&&(!archiveOnly||ARCHIVE_EXTENSIONS.includes(extension)))return file}}function determineBundledAsset(bundleDir,outputType){const archiveFile=findSingleFile(bundleDir,outputType!==bundling_1().BundlingOutput.SINGLE_FILE);switch(outputType===bundling_1().BundlingOutput.AUTO_DISCOVER&&(outputType=archiveFile?bundling_1().BundlingOutput.ARCHIVED:bundling_1().BundlingOutput.NOT_ARCHIVED),outputType){case bundling_1().BundlingOutput.NOT_ARCHIVED:return{path:bundleDir,packaging:assets_1().FileAssetPackaging.ZIP_DIRECTORY};case bundling_1().BundlingOutput.ARCHIVED:case bundling_1().BundlingOutput.SINGLE_FILE:if(!archiveFile)throw new Error("Bundling output directory is expected to include only a single file when `output`is set to`ARCHIVED`or`SINGLE_FILE`");return{path:archiveFile,packaging:assets_1().FileAssetPackaging.FILE,extension:getExtension(archiveFile)}}}function getExtension(source){for(const ext of ARCHIVE_EXTENSIONS)if(source.toLowerCase().endsWith(ext))return ext;return path().extname(source)}
^
Error: Failed to bundle asset BeaconStack/DocumentProcessor/BackendFunction/Code/Stage, bundle output is located at /Users/tksuzuki/projects/real-estate/aws-summit/beacon/cdk/cdk.out/bundling-temp-4ce92c7a2a90999813f586164b1168ef4a1d4a12d0e6a5386dba336e9c3b8072-error: Error: bash -c esbuild --bundle "/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/handlers/index.ts" --target=node22 --platform=node --outfile="/Users/tksuzuki/projects/real-estate/aws-summit/beacon/cdk/cdk.out/bundling-temp-4ce92c7a2a90999813f586164b1168ef4a1d4a12d0e6a5386dba336e9c3b8072/index.js" --sourcemap --external:aws-sdk --external:canvas run in directory /Users/tksuzuki/projects/real-estate/aws-summit/beacon/cdk exited with status 1
at AssetStaging.bundle (/Users/tksuzuki/projects/real-estate/aws-summit/beacon/cdk/node_modules/aws-cdk-lib/core/lib/asset-staging.js:2:619)
at AssetStaging.stageByBundling (/Users/tksuzuki/projects/real-estate/aws-summit/beacon/cdk/node_modules/aws-cdk-lib/core/lib/asset-staging.js:1:5358)
at stageThisAsset (/Users/tksuzuki/projects/real-estate/aws-summit/beacon/cdk/node_modules/aws-cdk-lib/core/lib/asset-staging.js:1:2728)
at Cache.obtain (/Users/tksuzuki/projects/real-estate/aws-summit/beacon/cdk/node_modules/aws-cdk-lib/core/lib/private/cache.js:1:242)
at new AssetStaging (/Users/tksuzuki/projects/real-estate/aws-summit/beacon/cdk/node_modules/aws-cdk-lib/core/lib/asset-staging.js:1:3125)
at new Asset (/Users/tksuzuki/projects/real-estate/aws-summit/beacon/cdk/node_modules/aws-cdk-lib/aws-s3-assets/lib/asset.js:1:1252)
at AssetCode.bind (/Users/tksuzuki/projects/real-estate/aws-summit/beacon/cdk/node_modules/aws-cdk-lib/aws-lambda/lib/code.js:5:4375)
at new Function (/Users/tksuzuki/projects/real-estate/aws-summit/beacon/cdk/node_modules/aws-cdk-lib/aws-lambda/lib/function.js:1:10877)
at new NodejsFunction (/Users/tksuzuki/projects/real-estate/aws-summit/beacon/cdk/node_modules/aws-cdk-lib/aws-lambda-nodejs/lib/function.js:1:2228)
at new DocumentPageProcessor (/Users/tksuzuki/projects/real-estate/aws-summit/beacon/cdk/lib/constructs/document-page-processor.ts:80:26)
Subprocess exited with error 1

#### チェックリスト作成の修正

- backend/src/features/result-combining/combine-results.ts 作りなおし。
- JSON 　で出力する
- 実際の Bedrock(Claude Sonnet 3.7)をコールする integ test も実装すること

#### ローカル開発環境の整備

- backend は Docker (docker-compose) 立ち上げ
- Frontend は npm run dev
  - これは既に確認できてるので上記コマンドを実行する必要はないです
  - その代わり env.local を新規に作成してください
- 上記確認できたら、そのやり方を書いた LOCAL_DEVELOPMENT.md を root に作成

#### 実装すべきエンドポイント

###### チェックリストセット管理

1. **チェックリストセットの取得**

   - 全てのチェックリストセットを一覧表示するエンドポイント

2. **チェックリストセットの作成**

   - 新しいチェックリストセットを作成するエンドポイント
   - 名前や説明などの基本情報を含める

3. **チェックリストセットの更新・削除**
   - 既存のチェックリストセットを編集・削除するエンドポイント

###### チェックリスト項目管理

4. **チェックリスト項目の取得**

   - 指定されたセットに属するチェック項目を階層構造で取得
   - item_type に基づいて適切にフォーマットされたデータを返す

5. **チェックリスト項目の作成・編集**
   - 新しいチェック項目の追加や既存項目の編集
   - フロー型と単純チェック型の両方をサポート

###### ファイル管理

6. **ファイルのアップロード**

   - 契約書や Excel ファイルなどのアップロード処理
   - 対応するチェックリストセットとの関連付け

7. **ファイルの一覧取得**
   - チェックリストセットごとのファイル一覧表示
   - ファイルのメタデータを含む

###### LLM 処理と結果管理

8. **文書の LLM 分析**

   - アップロードされたファイルを LLM で分析し、チェックリスト項目と照合
   - 抽出されたテキストや適合性判断を返す

9. **LLM 分析結果の取得**

   - 特定のドキュメントに対する LLM 分析結果を取得
   - 適合/不適合項目の一覧やフロー判断の結果を含む

10. **分析結果の修正**
    - LLM が判断した結果をユーザーが修正するためのエンドポイント
    - 修正履歴の保存と追跡

###### フロー評価

11. **フローチャート評価の実行**

    - 特定のドキュメントに対し、フローチャート型のチェックリストを評価
    - 最初の項目から開始して、LLM 判断に基づき分岐をたどる

12. **フロー評価結果の視覚化データ取得**
    - フローチャート評価の結果を視覚的に表示するためのデータを取得
    - たどったパスや最終結論を含む

###### ユーザー管理

13. **操作履歴の取得**
    - ユーザーごとの操作履歴や修正履歴の取得

### combine-result の修正

- ドキュメント ID とページナンバーを出力させる
  - LLM ではなく TS で
  - meta_data (json) atrribute で表現

```json
"meta_data": {
   "document_id": "xxx",
   "page_number": 123
}
```

- csv から json へ変更
- モデルは Sonnet 3.7
