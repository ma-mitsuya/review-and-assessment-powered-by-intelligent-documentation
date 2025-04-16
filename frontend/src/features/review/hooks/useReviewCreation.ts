/**
 * 審査ジョブ作成機能のカスタムフック
 */

import { useState } from 'react';
import { postData } from '../../../hooks/useFetch';
import { DocumentUploadResult } from '../../../hooks/useDocumentUpload';
import { ReviewJob } from '../types';
import { mutate } from 'swr';

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
  
  /**
   * 審査ジョブを作成する
   * アップロード済みのドキュメント情報を使用
   */
  const createReviewJob = async (data: CreateReviewJobRequest): Promise<ReviewJob> => {
    setIsCreating(true);
    setError(null);
    
    try {
      // 審査ジョブを作成
      const response = await postData('/review-jobs', {
        name: data.name,
        documentId: data.document.documentId,
        checkListSetId: data.checkListSetId
      });
      
      if (!response.success) {
        throw new Error(response.error || '審査ジョブの作成に失敗しました');
      }
      
      // 審査ジョブ一覧のキャッシュを無効化して再取得を強制
      mutate((key: string) => key.startsWith('/review-jobs'));
      
      return response.data;
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
