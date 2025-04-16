/**
 * 審査結果の階層構造を取得するためのカスタムフック
 */
import useSWR from 'swr';
import { fetcher } from '../../../hooks/useFetch';
import { ReviewResultHierarchy } from '../types';

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
  const key = getReviewResultHierarchyKey(jobId);
  
  const { data, error, mutate } = useSWR(key, fetcher);
  
  return {
    hierarchy: data?.data || [],
    isLoading: !error && !data && !!jobId,
    isError: !!error,
    mutate
  };
}
