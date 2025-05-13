# CDK 特記事項

## デプロイ

「デプロイしてください」と言われた場合にのみ実行:

```
cd backend
npm run build  // ここで失敗した場合、概要のみ報告。修正は行ってはいけません
cd ../cdk
cdk deploy --require-approval never
```
