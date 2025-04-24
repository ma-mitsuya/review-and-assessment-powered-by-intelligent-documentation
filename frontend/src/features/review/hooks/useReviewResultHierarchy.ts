/**
 * 審査結果の階層構造を取得するためのカスタムフック
 */
import useHttp from '../../../hooks/useHttp';
import { ReviewResultHierarchy, ApiResponse } from '../types';

/**
 * 審査結果の階層構造のキャッシュキーを生成する関数
 */
export const getReviewResultHierarchyKey = (jobId?: string) => {
  return jobId ? `/review-jobs/${jobId}/results/hierarchy` : null;
};

/**
 * 審査結果の階層構造を取得するためのカスタムフック
 * @param jobId 審査ジョブID
 * @returns 階層構造の審査結果、ローディング状態、エラー
 */
export function useReviewResultHierarchy(jobId?: string): {
  hierarchy: ReviewResultHierarchy[];
  isLoading: boolean;
  isError: boolean;
  mutate: () => void;
} {
  const http = useHttp();
  const key = getReviewResultHierarchyKey(jobId);
  
  const { data, error, isLoading, mutate } = http.get<ApiResponse<ReviewResultHierarchy[]>>(key);
  
  return {
    hierarchy: data?.data || [],
    isLoading,
    isError: !!error,
    mutate
  };
}
