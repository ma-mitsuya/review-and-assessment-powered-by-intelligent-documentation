/**
 * 審査ジョブ一覧を取得するためのカスタムフック
 */
import useSWR from 'swr';
import { fetcher } from '../../../hooks/useFetch';
import { ReviewJob } from '../types';

/**
 * 審査ジョブ一覧のキャッシュキーを生成する関数
 */
export const getReviewJobsKey = (
  page: number = 1,
  limit: number = 10,
  sortBy?: string,
  sortOrder?: 'asc' | 'desc',
  status?: string
) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });
  
  if (sortBy) params.append('sortBy', sortBy);
  if (sortOrder) params.append('sortOrder', sortOrder);
  if (status) params.append('status', status);
  
  return `/review-jobs?${params.toString()}`;
};

/**
 * 審査ジョブ一覧を取得するためのカスタムフック
 * @param page ページ番号
 * @param limit 1ページあたりの件数
 * @param sortBy ソート項目
 * @param sortOrder ソート順序
 * @param status ステータスでフィルタリング
 * @returns 審査ジョブ一覧と総数、ローディング状態、エラー
 */
export const useReviewJobs = (
  page: number = 1,
  limit: number = 10,
  sortBy?: string,
  sortOrder?: 'asc' | 'desc',
  status?: string
): {
  reviewJobs: ReviewJob[];
  total: number;
  isLoading: boolean;
  isError: boolean;
  mutate: () => void;
} => {
  const key = getReviewJobsKey(page, limit, sortBy, sortOrder, status);
  
  const { data, error, mutate } = useSWR(key, fetcher);
  
  return {
    reviewJobs: data?.data.reviewJobs || [],
    total: data?.data.total || 0,
    isLoading: !error && !data,
    isError: !!error,
    mutate
  };
};
