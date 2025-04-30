# 審査結果ページのペジネーション

## 　課題

- 現在、backend/src/api/features/review/routes/review-routes.ts の"/review-jobs/:jobId/results/hierarchy"で定義されている結果詳細が、レスポンスサイズが 6MB を超えることがある(APIGW の制限は 6MB)
- 階層の子要素すべてを取得しているためサイズが大きくなってしまうと考えられる
- 子要素は個別に取得するよう修正が必要
- 子要素取得中はローディングアイコンを表示
- parentId を指定
- 新規 APP のため後方互換性は不要。既存の実装は削除・修正置換せよ
