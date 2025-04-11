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
  getDocumentStatus: (documentId: string) => Promise<DocumentStatusItem | null>;
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
   * ドキュメントのステータスを取得する
   */
  const getDocumentStatus = async (documentId: string): Promise<DocumentStatusItem | null> => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/documents/${documentId}`);
      if (!response.ok) {
        throw new Error('ドキュメントステータスの取得に失敗しました');
      }
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'ドキュメントステータスの取得に失敗しました');
      }
      
      return {
        document_id: data.data.document_id,
        filename: data.data.filename,
        status: data.data.status
      };
    } catch (error) {
      console.error('ドキュメントステータスの取得エラー:', error);
      return null;
    }
  };
  
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
    getDocumentStatus,
    isCreating,
    error,
  };
}
