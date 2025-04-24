# フロントエンドフックリファクタリング計画

## 概要

現在の実装では、各機能ごとに独自のHTTPリクエスト処理とSWRの使用が散在しています。これを統一された`useHttp`フックを使用するように変更し、コードの一貫性と保守性を向上させます。

## 目的

1. すべてのCRUD操作を`frontend/src/hooks/useHttp.ts`を使って書き換える
2. `useFetch.ts`を完全に削除し、その機能を`useHttp.ts`に統合する
3. SWRの使用は`useHttp`内のみに限定し、他のレイヤーでは直接使用しない
4. コードの重複を減らし、一貫性のあるエラーハンドリングを実現する

## 対象ファイル

### 削除対象ファイル
1. `frontend/src/hooks/useFetch.ts` - 完全に削除

### チェックリスト機能
1. `frontend/src/features/checklist/hooks/useCheckListSets.ts`
2. `frontend/src/features/checklist/hooks/useCheckListItems.ts`
3. `frontend/src/features/checklist/hooks/useCheckListSetActions.ts`
4. `frontend/src/features/checklist/hooks/useChecklistCreation.ts`
5. `frontend/src/features/checklist/hooks/useCheckListFlow.ts` - HTTPリクエストなし、変更不要

### レビュー機能
1. `frontend/src/features/review/hooks/useReviewJobs.ts`
2. `frontend/src/features/review/hooks/useReviewJobActions.ts`
3. `frontend/src/features/review/hooks/useReviewResultHierarchy.ts`
4. `frontend/src/features/review/hooks/useReviewResultActions.ts`
5. `frontend/src/features/review/hooks/useReviewCreation.ts`

## 変更計画

### 1. 共通フック

#### `frontend/src/hooks/useFetch.ts`

このファイルは完全に削除します。すべての機能は`useHttp.ts`に統合されます。

### 2. チェックリスト機能

#### `frontend/src/features/checklist/hooks/useCheckListSets.ts`

```typescript
import useHttp from '../../../hooks/useHttp';
import { 
  CheckListSet, 
  CheckListSetDetail,
  HierarchicalCheckListItem,
  ApiResponse 
} from '../types';

// チェックリストセット一覧のキャッシュキーを生成する関数
export const getCheckListSetsKey = (page = 1, limit = 10, sortBy?: string, sortOrder?: 'asc' | 'desc') => {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  if (sortBy) params.append('sortBy', sortBy);
  if (sortOrder) params.append('sortOrder', sortOrder);
  
  return `/checklist-sets?${params.toString()}`;
};

/**
 * チェックリストセット一覧を取得するためのフック
 */
export const useCheckListSets = (
  page = 1,
  limit = 10,
  sortBy?: string,
  sortOrder?: 'asc' | 'desc'
) => {
  const http = useHttp();
  const url = getCheckListSetsKey(page, limit, sortBy, sortOrder);
  
  const { data, error, isLoading, mutate } = http.get<ApiResponse<{ checkListSets: CheckListSet[]; total: number }>>(url);

  // 明示的にデータを再取得する関数
  const revalidate = () => mutate();

  return {
    checkListSets: data?.data.checkListSets,
    total: data?.data.total,
    isLoading,
    isError: error,
    mutate,
    revalidate,
  };
};

/**
 * チェックリスト項目の階層構造を取得するためのフック
 */
export const useCheckListItemHierarchy = (setId: string | null) => {
  const http = useHttp();
  const url = setId ? `/checklist-sets/${setId}/items/hierarchy` : null;
  
  const { data, error, isLoading, mutate } = http.get<ApiResponse<HierarchicalCheckListItem[]>>(url);

  // 明示的にデータを再取得する関数
  const revalidate = () => mutate();

  return {
    hierarchyItems: data?.data || [],
    isLoading,
    isError: error,
    mutate,
    revalidate,
  };
};

/**
 * チェックリストセット詳細を取得するためのフック
 */
export const useCheckListSet = (id: string | null) => {
  const http = useHttp();
  const url = id ? `/checklist-sets/${id}` : null;
  
  const { data, error, isLoading, mutate } = http.get<ApiResponse<CheckListSetDetail>>(url);

  // 明示的にデータを再取得する関数
  const revalidate = () => mutate();

  return {
    checkListSet: data?.data,
    isLoading,
    isError: error,
    mutate,
    revalidate,
  };
};

/**
 * チェックリストセットを作成・更新・削除するためのフック
 */
export const useCheckListSetActions = () => {
  const http = useHttp();

  const createCheckListSet = async (
    name: string,
    description?: string,
    documents?: Array<{
      documentId: string;
      filename: string;
      s3Key: string;
      fileType: string;
    }>
  ): Promise<ApiResponse<CheckListSet>> => {
    const response = await http.post<ApiResponse<CheckListSet>>(`/checklist-sets`, {
      name,
      description,
      documents,
    });
    
    // キャッシュを無効化
    http.get(getCheckListSetsKey()).mutate();
    
    return response.data;
  };

  const updateCheckListSet = async (
    id: string,
    name: string,
    description?: string
  ): Promise<ApiResponse<CheckListSet>> => {
    const response = await http.put<ApiResponse<CheckListSet>>(`/checklist-sets/${id}`, {
      name,
      description,
    });
    
    // キャッシュを無効化
    http.get(`/checklist-sets`).mutate();
    http.get(`/checklist-sets/${id}`).mutate();
    
    return response.data;
  };

  const deleteCheckListSet = async (id: string): Promise<ApiResponse<{ deleted: boolean }>> => {
    const response = await http.delete<ApiResponse<{ deleted: boolean }>>(`/checklist-sets/${id}`);
    
    // キャッシュを無効化
    http.get(`/checklist-sets`).mutate();
    
    return response.data;
  };

  return {
    createCheckListSet,
    updateCheckListSet,
    deleteCheckListSet,
  };
};
```

#### `frontend/src/features/checklist/hooks/useCheckListItems.ts`

```typescript
import useHttp from '../../../hooks/useHttp';
import { 
  CheckListItem, 
  HierarchicalCheckListItem, 
  ApiResponse 
} from '../types';

/**
 * チェックリスト項目の階層構造を取得するためのフック
 */
export const useCheckListItems = (setId: string | null) => {
  const http = useHttp();
  const url = setId ? `/checklist-sets/${setId}/items/hierarchy` : null;
  
  const { data, error, isLoading, mutate } = http.get<ApiResponse<HierarchicalCheckListItem[]>>(url);

  return {
    hierarchy: data?.data,
    isLoading,
    isError: error,
    mutate,
  };
};

/**
 * チェックリスト項目詳細を取得するためのフック
 */
export const useCheckListItem = (setId: string | null, itemId: string | null) => {
  const http = useHttp();
  const url = setId && itemId ? `/checklist-sets/${setId}/items/${itemId}` : null;
  
  const { data, error, isLoading, mutate } = http.get<ApiResponse<CheckListItem>>(url);

  return {
    checkListItem: data?.data,
    isLoading,
    isError: error,
    mutate,
  };
};

/**
 * チェックリスト項目を操作するためのフック
 */
export const useCheckListItemMutations = (setId: string) => {
  const http = useHttp();

  const createCheckListItem = async (
    item: {
      name: string;
      description?: string;
      parentId?: string;
      itemType: 'simple' | 'flow';
      isConclusion: boolean;
      flowData?: {
        condition_type: 'YES_NO' | 'MULTI_CHOICE';
        next_if_yes?: string;
        next_if_no?: string;
        options?: Array<{
          option_id: string;
          label: string;
          next_check_id: string;
        }>;
      };
      documentId?: string;
    }
  ): Promise<ApiResponse<CheckListItem>> => {
    const response = await http.post<ApiResponse<CheckListItem>>(`/checklist-sets/${setId}/items`, item);
    
    // キャッシュを無効化
    http.get(`/checklist-sets/${setId}`).mutate();
    http.get(`/checklist-sets/${setId}/items/hierarchy`).mutate();
    
    return response.data;
  };

  const updateCheckListItem = async (
    itemId: string,
    updates: {
      name?: string;
      description?: string;
      isConclusion?: boolean;
      flowData?: {
        condition_type: 'YES_NO' | 'MULTI_CHOICE';
        next_if_yes?: string;
        next_if_no?: string;
        options?: Array<{
          option_id: string;
          label: string;
          next_check_id: string;
        }>;
      };
      documentId?: string;
    }
  ): Promise<ApiResponse<CheckListItem>> => {
    const response = await http.put<ApiResponse<CheckListItem>>(`/checklist-sets/${setId}/items/${itemId}`, updates);
    
    // キャッシュを無効化
    http.get(`/checklist-sets/${setId}`).mutate();
    http.get(`/checklist-sets/${setId}/items/hierarchy`).mutate();
    http.get(`/checklist-sets/${setId}/items/${itemId}`).mutate();
    
    return response.data;
  };

  const deleteCheckListItem = async (
    itemId: string
  ): Promise<ApiResponse<{ deleted: boolean }>> => {
    const response = await http.delete<ApiResponse<{ deleted: boolean }>>(`/checklist-sets/${setId}/items/${itemId}`);
    
    // キャッシュを無効化
    http.get(`/checklist-sets/${setId}`).mutate();
    http.get(`/checklist-sets/${setId}/items/hierarchy`).mutate();
    
    return response.data;
  };

  return {
    createCheckListItem,
    updateCheckListItem,
    deleteCheckListItem,
  };
};
```

#### `frontend/src/features/checklist/hooks/useCheckListSetActions.ts`

```typescript
import { useState } from 'react';
import useHttp from '../../../hooks/useHttp';
import { ApiResponse } from '../types';

/**
 * チェックリストセットの操作に関するフック
 */
export function useCheckListSetActions() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const http = useHttp();

  /**
   * チェックリストセットを削除する
   * @param id チェックリストセットID
   * @returns 削除結果
   */
  const deleteCheckListSet = async (id: string) => {
    setIsDeleting(true);
    setError(null);
    
    try {
      const response = await http.delete<ApiResponse<{ deleted: boolean }>>(`/checklist-sets/${id}`);
      
      // キャッシュを無効化
      http.get(`/checklist-sets`).mutate();
      
      return response.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('チェックリストセットの削除に失敗しました');
      setError(error);
      throw error;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    deleteCheckListSet,
    isDeleting,
    error
  };
}
```

#### `frontend/src/features/checklist/hooks/useChecklistCreation.ts`

```typescript
import { useState } from 'react';
import useHttp from '../../../hooks/useHttp';
import { DocumentUploadResult } from '../../../hooks/useDocumentUpload';
import { getCheckListSetsKey } from './useCheckListSets';
import { ApiResponse } from '../types';

/**
 * チェックリスト作成リクエスト
 */
export interface CreateChecklistRequest {
  name: string;
  description?: string;
  documents: DocumentUploadResult[];
}

/**
 * チェックリスト作成レスポンス
 */
export interface CreateChecklistResponse {
  check_list_set_id: string;
  name: string;
  description?: string;
  processing_status: string;
}

/**
 * チェックリスト作成フックの戻り値
 */
interface UseChecklistCreationReturn {
  createChecklist: (data: CreateChecklistRequest) => Promise<CreateChecklistResponse>;
  isCreating: boolean;
  error: Error | null;
}

/**
 * チェックリスト作成機能のカスタムフック
 */
export function useChecklistCreation(): UseChecklistCreationReturn {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const http = useHttp();
  
  /**
   * チェックリストを作成する
   * アップロード済みのドキュメント情報を使用
   */
  const createChecklist = async (data: CreateChecklistRequest): Promise<CreateChecklistResponse> => {
    setIsCreating(true);
    setError(null);
    
    try {
      // チェックリストセットを作成
      const response = await http.post<ApiResponse<CreateChecklistResponse>>('/checklist-sets', {
        name: data.name,
        description: data.description,
        documents: data.documents.map(doc => ({
          documentId: doc.documentId,
          filename: doc.filename,
          s3Key: doc.s3Key,
          fileType: doc.fileType
        }))
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'チェックリストセットの作成に失敗しました');
      }
      
      // キャッシュを無効化
      http.get(getCheckListSetsKey()).mutate();
      
      return response.data.data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('チェックリストの作成に失敗しました');
      setError(err);
      throw err;
    } finally {
      setIsCreating(false);
    }
  };
  
  return {
    createChecklist,
    isCreating,
    error,
  };
}
```

### 3. レビュー機能

#### `frontend/src/features/review/hooks/useReviewJobs.ts`

```typescript
import useHttp from '../../../hooks/useHttp';
import { ReviewJob, ApiResponse } from '../types';

/**
 * 審査ジョブ一覧のキャッシュキーを生成する関数
 */
export const getReviewJobsKey = (
  page: number = 1,
  limit: number = 10,
  sortBy?: string,
  sortOrder?: 'asc' | 'desc',
  status?: string
) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });
  
  if (sortBy) params.append('sortBy', sortBy);
  if (sortOrder) params.append('sortOrder', sortOrder);
  if (status) params.append('status', status);
  
  return `/review-jobs?${params.toString()}`;
};

/**
 * 審査ジョブ一覧を取得するためのカスタムフック
 */
export const useReviewJobs = (
  page: number = 1,
  limit: number = 10,
  sortBy?: string,
  sortOrder?: 'asc' | 'desc',
  status?: string
) => {
  const http = useHttp();
  const key = getReviewJobsKey(page, limit, sortBy, sortOrder, status);
  
  const { data, error, isLoading, mutate } = http.get<ApiResponse<{ reviewJobs: ReviewJob[]; total: number }>>(key);
  
  return {
    reviewJobs: data?.data.reviewJobs || [],
    total: data?.data.total || 0,
    isLoading,
    isError: !!error,
    mutate
  };
};
```

#### `frontend/src/features/review/hooks/useReviewJobActions.ts`

```typescript
import { useState } from 'react';
import useHttp from '../../../hooks/useHttp';
import { CreateReviewJobParams, ReviewJob, ApiResponse } from '../types';
import { getReviewJobsKey } from './useReviewJobs';

export function useReviewJobActions() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const http = useHttp();
  
  const createReviewJob = async (params: CreateReviewJobParams): Promise<ReviewJob> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await http.post<ApiResponse<ReviewJob>>('/review-jobs', params);
      
      // キャッシュを無効化 - 全てのreview-jobsクエリを無効化
      http.get(getReviewJobsKey()).mutate();
      
      return response.data.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create review job');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const deleteReviewJob = async (jobId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await http.delete<ApiResponse<{ deleted: boolean }>>(`/review-jobs/${jobId}`);
      
      // キャッシュを無効化
      http.get(getReviewJobsKey()).mutate();
      
      return response.data.data.deleted;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete review job');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    createReviewJob,
    deleteReviewJob,
    isLoading,
    error
  };
}
```

#### `frontend/src/features/review/hooks/useReviewResultHierarchy.ts`

```typescript
import useHttp from '../../../hooks/useHttp';
import { ReviewResultHierarchy, ApiResponse } from '../types';

/**
 * 審査結果の階層構造のキャッシュキーを生成する関数
 */
export const getReviewResultHierarchyKey = (jobId?: string) => {
  return jobId ? `/review-jobs/${jobId}/results/hierarchy` : null;
};

/**
 * 審査結果の階層構造を取得するためのカスタムフック
 */
export function useReviewResultHierarchy(jobId?: string) {
  const http = useHttp();
  const key = getReviewResultHierarchyKey(jobId);
  
  const { data, error, isLoading, mutate } = http.get<ApiResponse<ReviewResultHierarchy[]>>(key);
  
  return {
    hierarchy: data?.data || [],
    isLoading,
    isError: !!error,
    mutate
  };
}
```

#### `frontend/src/features/review/hooks/useReviewResultActions.ts`

```typescript
import { useState } from 'react';
import useHttp from '../../../hooks/useHttp';
import { UpdateReviewResultParams, ApiResponse } from '../types';
import { getReviewResultHierarchyKey } from './useReviewResultHierarchy';

export function useReviewResultActions() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const http = useHttp();
  
  const updateReviewResult = async (
    jobId: string,
    resultId: string,
    params: UpdateReviewResultParams
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await http.put<ApiResponse<any>>(`/review-jobs/${jobId}/results/${resultId}`, params);
      
      // キャッシュを無効化
      http.get(getReviewResultHierarchyKey(jobId)).mutate();
      
      return response.data.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update review result');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    updateReviewResult,
    isLoading,
    error
  };
}
```

#### `frontend/src/features/review/hooks/useReviewCreation.ts`

```typescript
import { useState } from 'react';
import useHttp from '../../../hooks/useHttp';
import { DocumentUploadResult } from '../../../hooks/useDocumentUpload';
import { ReviewJob, ApiResponse } from '../types';
import { getReviewJobsKey } from './useReviewJobs';

/**
 * 審査ジョブ作成リクエスト
 */
export interface CreateReviewJobRequest {
  name: string;
  document: DocumentUploadResult;
  checkListSetId: string;
}

/**
 * 審査ジョブ作成フックの戻り値
 */
interface UseReviewCreationReturn {
  createReviewJob: (data: CreateReviewJobRequest) => Promise<ReviewJob>;
  isCreating: boolean;
  error: Error | null;
}

/**
 * 審査ジョブ作成機能のカスタムフック
 */
export function useReviewCreation(): UseReviewCreationReturn {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const http = useHttp();
  
  /**
   * 審査ジョブを作成する
   * アップロード済みのドキュメント情報を使用
   */
  const createReviewJob = async (data: CreateReviewJobRequest): Promise<ReviewJob> => {
    setIsCreating(true);
    setError(null);
    
    try {
      // 審査ジョブを作成
      const response = await http.post<ApiResponse<ReviewJob>>('/review-jobs', {
        name: data.name,
        documentId: data.document.documentId,
        checkListSetId: data.checkListSetId,
        filename: data.document.filename,
        s3Key: data.document.s3Key,
        fileType: data.document.fileType
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || '審査ジョブの作成に失敗しました');
      }
      
      // キャッシュを無効化
      http.get(getReviewJobsKey()).mutate();
      
      return response.data.data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('審査ジョブの作成に失敗しました');
      setError(err);
      throw err;
    } finally {
      setIsCreating(false);
    }
  };
  
  return {
    createReviewJob,
    isCreating,
    error,
  };
}
```

## 実装手順

1. まず、`useFetch.ts`を削除する
2. チェックリスト機能のフックを一つずつ修正する
   - `useCheckListSets.ts`
   - `useCheckListItems.ts`
   - `useCheckListSetActions.ts`
   - `useChecklistCreation.ts`
3. レビュー機能のフックを一つずつ修正する
   - `useReviewJobs.ts`
   - `useReviewJobActions.ts`
   - `useReviewResultHierarchy.ts`
   - `useReviewResultActions.ts`
   - `useReviewCreation.ts`
4. 各変更後にテストを行い、機能が正常に動作することを確認する

## 注意点

1. SWRの使用は`useHttp`内のみに限定し、他のレイヤーでは直接使用しない
2. キャッシュの更新は`http.get(...).mutate()`を使用する
3. エラーハンドリングの方法が変わるため、既存のエラーハンドリングコードを適切に修正する
4. 型定義を適切に行い、TypeScriptのエラーをすべて解消する

## リスクと対策

1. **リスク**: 既存の機能が壊れる可能性がある
   **対策**: 一つのフックずつ修正し、各修正後にテストを行う

2. **リスク**: 型の不一致によるエラーが発生する可能性がある
   **対策**: 型定義を慎重に行い、TypeScriptのエラーをすべて解消する

3. **リスク**: キャッシュの更新が正しく行われない可能性がある
   **対策**: キャッシュキーを適切に管理し、関連するキャッシュを確実に無効化する

4. **リスク**: エラーハンドリングの方法が変わることによる影響
   **対策**: エラーハンドリングの方法を統一し、既存のエラーハンドリングコードを適切に修正する
