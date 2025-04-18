# 審査タスク

- .amazonq/rules/api_specs/review.md に記載されている「審査ジョブの作成」で、実際に審査ように起動する SFn を設計、実装するタスクです
- SFn はシンプルに lambda を起動するだけとします
- lambda 処理は/backend/src/review-workflow ディレクトリ下に実装します
- CDK 定義は cdk/lib/constructs 下に定義します
  - backend lambda は checklist workflow と同様、props で受け取ります
- backend/src/api/features/review/services/review-job-service.ts で create 時に呼び出した SFn で処理を実行します
- S3 のキーは backend/src/checklist-workflow/common/storage-paths.ts の getReviewDocumentKey で取得できます
- チェックリストの内容は RDB から取得できます。backend/src/api/features/checklist/repositories や backend/src/api/features/checklist/services の実装が使えそうならそのまま使います
- 審査した結果を RDB に格納しタスクを終えます。backend/src/api/features/review にある repository や service が利用できます
- Frontend は現時点で不要

- 注意：すべての計画タスクには「新規作成するファイル」「削除するファイル」「修正するファイル」を明確にせよ
