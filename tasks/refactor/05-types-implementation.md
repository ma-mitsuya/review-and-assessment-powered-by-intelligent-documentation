# 型定義ファイル実装計画

## Checklist機能の型定義統合

### 新規作成するファイル: `/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/features/checklist/types.ts`

```typescript
/**
 * チェックリスト機能の型定義
 */

// チェックリストセット関連の型定義
export interface ChecklistSetDto {
  id: string;
  name: string;
  description: string | null;
  isEditable: boolean;
}

export interface DocumentInfo {
  documentId: string;
  filename: string;
  s3Key: string;
  fileType: string;
}

export interface CreateChecklistSetParams {
  name: string;
  description?: string;
  documents: DocumentInfo[];
}

export interface UpdateChecklistSetParams {
  name?: string;
  description?: string;
}

export interface GetChecklistSetsParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface GetChecklistSetsResult {
  checkListSets: Array<{
    checkListSetId: string;
    name: string;
    description: string | null;
    processingStatus: "pending" | "in_progress" | "completed";
    isEditable: boolean;
  }>;
  total: number;
}

// チェックリスト項目関連の型定義
export interface ChecklistItemDto {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  itemType: "simple" | "flow";
  isConclusion: boolean;
  checkListSetId: string;
  documentId: string | null;
  flowData?: {
    conditionType: string;
    nextIfYes?: string;
    nextIfNo?: string;
  };
}

export interface CreateChecklistItemParams {
  name: string;
  description?: string;
  parentId?: string | null;
  itemType: "simple" | "flow";
  isConclusion: boolean;
  documentId?: string | null;
  flowData?: {
    conditionType: string;
    nextIfYes?: string;
    nextIfNo?: string;
  };
}

export interface UpdateChecklistItemParams {
  name?: string;
  description?: string;
  isConclusion?: boolean;
  documentId?: string | null;
  flowData?: {
    conditionType?: string;
    nextIfYes?: string;
    nextIfNo?: string;
  };
}

export interface GetChecklistItemsParams {
  checkListSetId: string;
}

export interface GetChecklistItemHierarchyParams {
  checkListSetId: string;
}

export interface ChecklistItemHierarchyNode extends ChecklistItemDto {
  children: ChecklistItemHierarchyNode[];
}
```

## Review機能の型定義整理

### 修正するファイル: `/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/features/review/types.ts`

既存の型定義ファイルを整理し、必要に応じて追加・修正します。

```typescript
/**
 * 審査機能の型定義
 */

// 審査ドキュメント関連
export interface ReviewDocumentDto {
  id: string;
  filename: string;
  s3Path: string;
  fileType: string;
  uploadDate: Date;
  userId: string | null;
  status: string;
}

export interface CreateReviewDocumentParams {
  id: string;
  filename: string;
  s3Key: string;
  fileType: string;
  userId?: string | null;
}

export interface GetReviewPresignedUrlParams {
  filename: string;
  contentType: string;
}

// 審査ジョブ関連
export interface ReviewJobDto {
  id: string;
  name: string;
  status: string;
  documentId: string;
  checkListSetId: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  userId: string | null;
  document?: ReviewDocumentDto;
  checkListSet?: {
    id: string;
    name: string;
    description?: string | null;
  };
}

export interface ReviewJobSummary {
  total: number;
  passed: number;
  failed: number;
  processing?: number;
  pending?: number;
}

export interface CreateReviewJobParams {
  name: string;
  documentId: string;
  checkListSetId: string;
  fileType?: string;
  filename?: string;
  s3Key?: string;
  userId?: string | null;
}

export interface GetReviewJobsParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: string;
}

// 審査結果関連
export interface ReviewResultDto {
  id: string;
  reviewJobId: string;
  checkId: string;
  status: string;
  result: string | null;
  confidenceScore: number | null;
  explanation: string | null;
  extractedText: string | null;
  userOverride: boolean;
  userComment: string | null;
  createdAt: Date;
  updatedAt: Date;
  checkList?: {
    id: string;
    name: string;
    description: string | null;
    parentId: string | null;
    itemType: string;
    isConclusion: boolean;
    flowData?: any;
  };
}

export interface ReviewResultHierarchyNode extends ReviewResultDto {
  children: ReviewResultHierarchyNode[];
}

export interface GetReviewResultItemsParams {
  jobId: string;
}

export interface UpdateReviewResultParams {
  result: string;
  userComment?: string | null;
}
```

## 実装方針

1. 既存のコードから使用されている型定義を抽出
2. 関連する型をグループ化
3. 命名規則を統一
4. 必要に応じてコメントを追加
5. 既存のコードから新しい型定義ファイルを参照するように修正
