/**
 * チェックリスト作成機能のカスタムフック
 */

import { useState } from 'react';
import { postData } from '../../../hooks/useFetch';
import { useFileUpload } from '../../../hooks/useFileUpload';
import { DocumentStatus } from '../types';
import { DocumentStatusItem } from '../components/ProcessingStatus';

/**
 * チェックリスト作成リクエスト
 */
export interface CreateChecklistRequest {
  name: string;
  description?: string;
  files: File[];
}

/**
 * チェックリスト作成レスポンス
 */
export interface CreateChecklistResponse {
  check_list_set_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  documents: DocumentStatusItem[];
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
  const { uploadFiles } = useFileUpload();
  
  /**
   * チェックリストを作成する
   */
  const createChecklist = async (data: CreateChecklistRequest): Promise<CreateChecklistResponse> => {
    setIsCreating(true);
    setError(null);
    
    try {
      // 1. チェックリストセットを作成
      const checklistSetResponse = await postData('/checklist-sets', {
        name: data.name,
        description: data.description
      });
      
      if (!checklistSetResponse.success) {
        throw new Error(checklistSetResponse.error || 'チェックリストセットの作成に失敗しました');
      }
      
      const checkListSetId = checklistSetResponse.data.check_list_set_id;
      
      // 2. ファイルをアップロードして処理を開始
      const uploadResults = await uploadFiles(data.files, checkListSetId);
      
      // 結果を返す
      return {
        ...checklistSetResponse.data,
        documents: uploadResults.map(result => ({
          document_id: result.documentId,
          filename: result.fileName,
          status: result.status
        }))
      };
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
