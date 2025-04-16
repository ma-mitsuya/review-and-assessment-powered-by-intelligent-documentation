/**
 * チェックリスト作成機能のカスタムフック
 */

import { useState } from 'react';
import { postData } from '../../../hooks/useFetch';
import { DocumentUploadResult } from '../../../hooks/useDocumentUpload';
import { getCheckListSetsKey } from './useCheckListSets';
import { mutate } from 'swr';

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
  
  /**
   * チェックリストを作成する
   * アップロード済みのドキュメント情報を使用
   */
  const createChecklist = async (data: CreateChecklistRequest): Promise<CreateChecklistResponse> => {
    setIsCreating(true);
    setError(null);
    
    try {
      // チェックリストセットを作成
      const response = await postData('/checklist-sets', {
        name: data.name,
        description: data.description,
        documents: data.documents.map(doc => ({
          documentId: doc.documentId,
          filename: doc.filename,
          s3Key: doc.s3Key,
          fileType: doc.fileType
        }))
      });
      
      if (!response.success) {
        throw new Error(response.error || 'チェックリストセットの作成に失敗しました');
      }
      
      // チェックリスト一覧のキャッシュを無効化して再取得を強制
      // デフォルトのキャッシュキーを無効化
      mutate(getCheckListSetsKey());
      
      // 他のページやソート順のキャッシュも無効化
      const checklistSetsPattern = new RegExp(`^/api/checklist-sets\\?`);
      const keys = Array.from((window as any).SWR?._keys || [])
        .filter((key: string) => checklistSetsPattern.test(key));
      
      // すべてのキャッシュを無効化
      keys.forEach((key: string) => {
        mutate(key);
      });
      
      return response.data;
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
