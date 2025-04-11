# バックエンドリファクタリング: ドメイン駆動設計の適用

## 変更内容

1. **ドメイン中心の設計に変更**
   - `document-upload` 機能を `checklist-management` に統合
   - APIパスをドメイン表現に変更（`/api/documents/...` → `/api/checklists/uploads/...`）

2. **フロントエンドの構造との一貫性確保**
   - フロントエンドの `checklist-creation` と `checklist` の構造に合わせてバックエンドを整理

3. **RESTfulなAPI設計の改善**
   - リソースIDをURLパスに含める設計に統一
   - 例: `/api/checklists/uploads/:id/process`

## 変更したファイル

1. **新規作成ファイル**
   - `/src/api/features/checklist-management/document-repository.ts`
   - `/src/api/features/checklist-management/document-service.ts`
   - `/src/api/features/checklist-management/__tests__/document-service.test.ts`

2. **更新ファイル**
   - `/src/api/features/checklist-management/types.ts`
   - `/src/api/features/checklist-management/routes.ts`
   - `/src/api/features/checklist-management/index.ts`
   - `/src/api/index.ts`

3. **削除対象ファイル**
   - `/src/api/features/document-upload/` ディレクトリ全体

## 新しいAPIエンドポイント

```
/api/checklists                           # チェックリスト一覧取得・作成
/api/checklists/:id                       # チェックリスト取得・更新・削除
/api/checklists/:checklistId/documents    # チェックリストに紐づくドキュメント一覧取得
/api/checklists/uploads/presigned-url     # 単一ファイルのPresigned URL取得
/api/checklists/uploads/presigned-urls    # 複数ファイルのPresigned URL取得
/api/checklists/uploads/:id/process       # ドキュメント処理開始
/api/checklists/uploads/:id/status        # ドキュメントステータス取得
```

## 今後の課題

1. フロントエンドのAPI呼び出し部分を新しいエンドポイントに対応させる
2. 古いAPIエンドポイントを完全に削除する前に、移行期間を設けて互換性を確保する
3. ドキュメント処理のワークフローを最適化する
