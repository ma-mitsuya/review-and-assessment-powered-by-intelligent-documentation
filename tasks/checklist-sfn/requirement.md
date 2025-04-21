## ワークフロー拡張

Checklist のワークフロー cdk/lib/constructs/document-page-processor.ts の処理の拡張

- 最後に RDB に格納する
- api/features/checklist のレポジトリを利用
  - prisma 直接起動は禁止
- 新規作成が成功したのか、エラーしたのか、新規の lambda task で実施
- 新規作成・削除・修正するファイル名を明示せよ
- ID の取り扱い
  - 前段の SFn タスクで ID がどのような取り扱いになっているか注意深く精査せよ
    - backend/src/checklist-workflow/document-processing/llm-processing.ts
    - backend/src/checklist-workflow/aggregate-results/index.ts
  - repository で保存する場合、既存の repository のスキーマや、それがどのように使われているか調査し、上記の ID との整合性を考え、報告せよ
