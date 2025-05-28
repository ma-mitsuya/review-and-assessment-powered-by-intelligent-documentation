-- エラー詳細カラムの追加
ALTER TABLE checklist_documents ADD COLUMN error_detail TEXT NULL;
ALTER TABLE review_jobs ADD COLUMN error_detail TEXT NULL;
