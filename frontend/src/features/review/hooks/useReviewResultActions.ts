/**
 * 審査結果の更新アクションを提供するカスタムフック
 */
import { useState } from 'react';
import { mutate } from 'swr';
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
  ): Promise<any> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await http.put<ApiResponse<any>>(`/review-jobs/${jobId}/results/${resultId}`, params);
      
      // キャッシュを無効化
      mutate(getReviewResultHierarchyKey(jobId));
      
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
