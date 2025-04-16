/**
 * 審査結果の更新アクションを提供するカスタムフック
 */
import { useState } from 'react';
import { putData } from '../../../hooks/useFetch';
import { UpdateReviewResultParams } from '../types';
import { mutate } from 'swr';

export function useReviewResultActions() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const updateReviewResult = async (
    jobId: string,
    resultId: string,
    params: UpdateReviewResultParams
  ): Promise<any> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await putData(`/review-jobs/${jobId}/results/${resultId}`, params);
      
      // キャッシュを更新
      mutate(`/review-jobs/${jobId}/results/hierarchy`);
      
      return response.data;
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
