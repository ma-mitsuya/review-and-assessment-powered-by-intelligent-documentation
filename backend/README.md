## Migration 確認

# Prisma マイグレーション確認用 SQL

マイグレーションが正常に完了したことを確認するために、以下の SQL クエリを実行できます：

## 1. テーブルの存在確認

```sql
SHOW TABLES;
```

これで全テーブルが作成されているか確認できます。出力として以下のようなテーブルが表示されるはずです:

- check_list
- check_list_sets
- checklist_documents
- review_documents
- review_jobs
- review_results
- extracted_items
- check_results

## 2. テーブル構造の確認

```sql
DESCRIBE check_list_sets;
DESCRIBE check_list;
DESCRIBE review_jobs;
```
