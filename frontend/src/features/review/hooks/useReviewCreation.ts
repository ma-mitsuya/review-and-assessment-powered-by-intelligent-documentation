/**
 * 審査ジョブ作成機能のカスタムフック
 */

import { useState } from 'react';
import { mutate } from 'swr';
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
      mutate(getReviewJobsKey());
      
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
