# CDK 特記事項

## デプロイ

「デプロイしてください」と言われた場合にのみ実行:

```
cd backend
npm run build  // ここで失敗した場合、概要のみ報告。修正は行ってはいけません
cd ../cdk
cdk deploy --require-approval never
```

## チェックリスト抽出

「チェックリスト抽出テストしてください」と言われた場合にのみ実行

- cdk/lib/constructs/document-page-processor.ts の SFn を動作させ、処理が正常終了するかを確認する
- CfnOutput の StateMachineArn から Arn 取得可能
- input は下記:
  画像の場合：

```json
{
  "documentId": "test-image-1",
  "fileName": "placement_diagram.png"
}
```

PDF の場合:

```json
{
  "documentId": "test-pdf-1",
  "fileName": "他社物件書面チェックリスト（原本）.pdf"
}
```
