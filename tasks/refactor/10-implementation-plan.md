# 実装計画

## 実装順序

1. エラーハンドリングの共通クラス作成
2. Checklist機能のリファクタリング
   - 型定義の統合
   - スキーマ定義の統合
   - ルート定義の統合
   - リポジトリの最適化
   - サービスの最適化
   - ハンドラーの最適化
3. Review機能のリファクタリング
   - ルート定義のスタイル統一
   - サービスの最適化
   - ハンドラーの最適化

## 各ステップの詳細

### 1. エラーハンドリングの共通クラス作成

1. `/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/core/errors/application-errors.ts` を作成
2. `/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/core/errors/error-handler.ts` を作成
3. `/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/core/errors/index.ts` を作成
4. `/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/index.ts` にエラーハンドラーを登録

### 2. Checklist機能のリファクタリング

#### 型定義の統合
1. `/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/features/checklist/types.ts` を作成
2. 既存の型定義ファイルを削除

#### スキーマ定義の統合
1. `/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/features/checklist/schemas.ts` を作成
2. 既存のスキーマ定義ファイルを削除

#### ルート定義の統合
1. `/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/features/checklist/routes.ts` を作成
2. `/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/features/checklist/index.ts` を更新
3. 既存のルート定義ファイルを削除

#### リポジトリの最適化
1. `/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/features/checklist/repositories/checklist-set-repository.ts` を修正
2. `/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/features/checklist/repositories/checklist-item-repository.ts` を修正
3. `/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/features/checklist/repositories/index.ts` を削除

#### サービスの最適化
1. `/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/features/checklist/services/checklist-set-service.ts` を修正
2. `/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/features/checklist/services/checklist-item-service.ts` を修正

#### ハンドラーの最適化
1. `/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/features/checklist/handlers/checklist-set-handlers.ts` を修正
2. `/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/features/checklist/handlers/checklist-item-handlers.ts` を修正

### 3. Review機能のリファクタリング

#### ルート定義のスタイル統一
1. `/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/features/review/routes/review-routes.ts` を修正

#### サービスの最適化
1. `/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/features/review/services/review-job-service.ts` を修正
2. `/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/features/review/services/review-result-service.ts` を修正
3. `/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/features/review/services/review-document-service.ts` を修正

#### ハンドラーの最適化
1. `/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/features/review/handlers/review-job-handlers.ts` を修正
2. `/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/features/review/handlers/review-result-handlers.ts` を修正
3. `/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/features/review/handlers/review-document-handlers.ts` を修正

## テスト計画

各ステップ実装後に以下のテストを実施:

1. ビルドが正常に完了するか確認
   ```bash
   cd backend
   npm run build
   ```

2. 単体テストが正常に実行されるか確認
   ```bash
   npm run test
   ```

3. 必要に応じて手動テストを実施
   - チェックリスト機能の動作確認
   - 審査機能の動作確認
   - エラーハンドリングの動作確認

## 注意点

1. 既存の機能を壊さないよう慎重に進める
2. 各ステップごとにビルドとテストを実施
3. コメントを適切に更新
4. 型定義の整合性を確保
5. エラーハンドリングの一貫性を確保
