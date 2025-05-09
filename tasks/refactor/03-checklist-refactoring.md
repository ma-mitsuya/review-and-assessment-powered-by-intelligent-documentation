# Checklist機能リファクタリング計画

## 1. ディレクトリ構造の整理

### 新規作成するファイル
- `/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/features/checklist/types.ts` - 型定義を統合
- `/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/features/checklist/routes.ts` - ルート定義を統合
- `/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/features/checklist/schemas.ts` - スキーマ定義を統合

### 削除するファイル
- `/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/features/checklist/types/checklist-item-types.ts`
- `/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/features/checklist/types/index.ts`
- `/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/features/checklist/routes/checklist-item-routes.ts`
- `/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/features/checklist/routes/checklist-set-routes.ts`
- `/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/features/checklist/schemas/checklist-item-schemas.ts`
- `/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/features/checklist/schemas/checklist-set-schemas.ts`

### 修正するファイル
- `/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/features/checklist/index.ts` - 新しいルート定義を使用

## 2. リポジトリの最適化

### 修正するファイル
- `/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/features/checklist/repositories/checklist-set-repository.ts`
  - インターフェース削除
  - 内部メソッドをprivateに変更
  - スネークケースをキャメルケースに変更
  
- `/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/features/checklist/repositories/checklist-item-repository.ts`
  - インターフェース削除
  - 内部メソッドをprivateに変更
  - スネークケースをキャメルケースに変更

### 削除するファイル
- `/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/features/checklist/repositories/index.ts`

## 3. サービスの最適化

### 修正するファイル
- `/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/features/checklist/services/checklist-set-service.ts`
  - 内部メソッドをprivateに変更
  - 単一責務の原則に従ってメソッドを分割
  - 新しいエラークラスを使用
  - スネークケースをキャメルケースに変更

- `/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/features/checklist/services/checklist-item-service.ts`
  - 内部メソッドをprivateに変更
  - 単一責務の原則に従ってメソッドを分割
  - 新しいエラークラスを使用
  - スネークケースをキャメルケースに変更

## 4. ハンドラーの最適化

### 修正するファイル
- `/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/features/checklist/handlers/checklist-set-handlers.ts`
  - 新しいエラークラスを使用したエラーハンドリング
  - 型定義を新しい型定義ファイルから参照

- `/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/features/checklist/handlers/checklist-item-handlers.ts`
  - 新しいエラークラスを使用したエラーハンドリング
  - 型定義を新しい型定義ファイルから参照

## 実装手順

1. 型定義ファイルの統合
2. スキーマ定義ファイルの統合
3. ルート定義ファイルの統合
4. リポジトリの最適化
5. サービスの最適化
6. ハンドラーの最適化
7. index.tsの更新
