/**
 * 審査ジョブの作成・削除などのアクションを提供するカスタムフック
 */
import { useState } from 'react';
import { postData, deleteData } from '../../../hooks/useFetch';
import { CreateReviewJobParams, ReviewJob } from '../types';
import { mutate } from 'swr';

export function useReviewJobActions() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const createReviewJob = async (params: CreateReviewJobParams): Promise<ReviewJob> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await postData('/review-jobs', params);
      
      // キャッシュを更新
      mutate((key: string) => key.startsWith('/review-jobs?'));
      
      return response.data;
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
      const response = await deleteData(`/review-jobs/${jobId}`);
      
      // キャッシュを更新
      mutate((key: string) => key.startsWith('/review-jobs?'));
      
      return response.data.deleted;
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
