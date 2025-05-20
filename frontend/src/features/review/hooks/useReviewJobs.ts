import { useState } from 'react';
import useHttp from '../../../hooks/useHttp';
import { mutate } from 'swr';
import { 
  ReviewJobMetaModel,
  CreateReviewJobRequest,
  GetAllReviewJobsResponse,
  CreateReviewJobResponse,
  DeleteReviewJobResponse
} from '../types';
import { DocumentUploadResult } from '../../../hooks/useDocumentUpload';

/**
 * 審査ジョブ一覧のキャッシュキーを生成する関数
 */
export const getReviewJobsKey = (params?: { 
  page?: number; 
  limit?: number; 
  sortBy?: string; 
  sortOrder?: 'asc' | 'desc'; 
  status?: string 
}) => {
  const defaultParams = {
    page: 1,
    limit: 10,
    ...params
  };
  
  const urlParams = new URLSearchParams();
  
  Object.entries(defaultParams).forEach(([key, value]) => {
    if (value !== undefined) {
      urlParams.append(key, value.toString());
    }
  });
  
  return `/review-jobs?${urlParams.toString()}`;
};

/**
 * 審査ジョブに関する操作をまとめたカスタムフック
 */
export const useReviewJobs = (
  page: number = 1,
  limit: number = 10,
  sortBy?: string,
  sortOrder?: 'asc' | 'desc',
  status?: string
) => {
  const http = useHttp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // 審査ジョブ一覧の取得
  const params = { page, limit, sortBy, sortOrder, status };
  const key = getReviewJobsKey(params);
  const { data, error: fetchError, isLoading, mutate: refetch } = http.get<GetAllReviewJobsResponse>(key);
  
  // 明示的にデータを再取得する関数
  const revalidate = () => refetch();
  
  // 審査ジョブの作成
  const createJob = async (params: {
    name: string;
    document: DocumentUploadResult;
    checkListSetId: string;
  }): Promise<ReviewJobMetaModel> => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // バックエンドが期待する形式に変換
      const requestBody: CreateReviewJobRequest = {
        name: params.name,
        documentId: params.document.documentId,
        checkListSetId: params.checkListSetId,
        filename: params.document.filename,
        s3Key: params.document.s3Key,
        fileType: params.document.fileType
      };
      
      const response = await http.post<CreateReviewJobResponse>('/review-jobs', requestBody);
      
      // キャッシュを更新
      mutate(getReviewJobsKey());
      
      return response.data.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create review job');
      setError(error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // 審査ジョブの削除
  const deleteJob = async (jobId: string): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await http.delete<DeleteReviewJobResponse>(`/review-jobs/${jobId}`);
      
      // キャッシュを更新
      mutate(getReviewJobsKey());
      
      return response.data.success;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete review job');
      setError(error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // 審査ジョブの詳細取得
  const getJob = (jobId: string | null) => {
    const jobUrl = jobId ? `/review-jobs/${jobId}` : null;
    const { data: jobData, error: jobError, isLoading: jobLoading } = http.get<GetAllReviewJobsResponse>(jobUrl);
    
    return {
      job: jobData?.data,
      isLoading: jobLoading,
      error: jobError
    };
  };

  return {
    // データ取得
    reviewJobs: data?.data.reviewJobs || [],
    total: data?.data.total || 0,
    isLoading,
    error: fetchError || error,
    refetch,
    revalidate,
    
    // CRUD操作
    createJob,
    deleteJob,
    getJob,
    
    // 状態
    isSubmitting
  };
};
