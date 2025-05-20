/**
 * 審査結果項目を取得するためのカスタムフック
 */
import useHttp from '../../../hooks/useHttp';
import { 
  ReviewResultDetailModel, 
  GetReviewResultItemsResponse 
} from '../types';
import { FilterType } from '../components/ReviewResultFilter';

/**
 * 審査結果項目のキャッシュキーを生成する関数
 */
export const getReviewResultItemsKey = (jobId?: string, parentId?: string, filter?: FilterType) => {
  if (!jobId) return null;
  
  let url = `/review-jobs/${jobId}/results/items`;
  const params = [];
  
  if (parentId) {
    params.push(`parentId=${parentId}`);
  }
  
  if (filter && filter !== 'all') {
    params.push(`filter=${filter}`);
  }
  
  if (params.length > 0) {
    url += `?${params.join('&')}`;
  }
  
  console.log(`[Frontend] Building URL: ${url}`);
  return url;
};

/**
 * 審査結果項目を取得するためのカスタムフック
 * @param jobId 審査ジョブID
 * @param parentId 親項目ID（指定がない場合はルート項目を取得）
 * @param filter フィルタリング条件
 * @returns 審査結果項目、ローディング状態、エラー
 */
export function useReviewResultItems(jobId?: string, parentId?: string, filter: FilterType = 'all'): {
  items: ReviewResultDetailModel[];
  isLoading: boolean;
  isError: boolean;
  mutate: () => void;
} {
  const http = useHttp();
  const key = getReviewResultItemsKey(jobId, parentId, filter);
  
  const { data, error, isLoading, mutate } = http.get<GetReviewResultItemsResponse>(key);
  
  if (data) {
    console.log(`[Frontend] Received data for ${key}:`, data.success, data.data?.length || 0);
  }
  if (error) {
    console.error(`[Frontend] Error for ${key}:`, error);
  }
  
  return {
    items: data?.data || [],
    isLoading,
    isError: !!error,
    mutate
  };
}
