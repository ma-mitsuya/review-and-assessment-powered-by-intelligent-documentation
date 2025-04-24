/**
 * 審査ジョブの作成・削除などのアクションを提供するカスタムフック
 */
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
