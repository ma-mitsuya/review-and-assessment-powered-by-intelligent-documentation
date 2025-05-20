import { useState } from 'react';
import useHttp from '../../../hooks/useHttp';
import { mutate } from 'swr';
import { 
  ReviewResultDetailModel,
  GetReviewResultItemsResponse,
  OverrideReviewResultRequest,
  OverrideReviewResultResponse
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
  
  return url;
};

/**
 * 審査結果の階層構造キャッシュキーを生成する関数
 */
export const getReviewResultHierarchyKey = (jobId: string | null) => 
  jobId ? `/review-jobs/${jobId}/results/hierarchy` : null;

/**
 * 審査結果に関する操作をまとめたカスタムフック
 */
export const useReviewResults = (jobId: string | null, parentId?: string, filter: FilterType = 'all') => {
  const http = useHttp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // 階層構造データの取得
  const hierarchyUrl = getReviewResultHierarchyKey(jobId);
  const { 
    data: hierarchyData, 
    error: hierarchyError, 
    isLoading: hierarchyLoading, 
    mutate: refetchHierarchy 
  } = http.get<GetReviewResultItemsResponse>(hierarchyUrl);
  
  // 項目リストの取得
  const itemsUrl = getReviewResultItemsKey(jobId || undefined, parentId, filter);
  const { 
    data: itemsData, 
    error: itemsError, 
    isLoading: itemsLoading, 
    mutate: refetchItems 
  } = http.get<GetReviewResultItemsResponse>(itemsUrl);
  
  // 審査結果の更新
  const updateResult = async (
    reviewJobId: string,
    resultId: string,
    params: OverrideReviewResultRequest
  ): Promise<OverrideReviewResultResponse> => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await http.put<OverrideReviewResultResponse>(`/review-jobs/${reviewJobId}/results/${resultId}`, params);
      
      // キャッシュを更新
      mutate(getReviewResultHierarchyKey(reviewJobId));
      // 項目一覧のキャッシュを無効化
      mutate(getReviewResultItemsKey(reviewJobId));
      // 親階層のキャッシュも無効化（親項目がある場合）
      mutate((key) => typeof key === 'string' && key.startsWith(`/review-jobs/${reviewJobId}/results/items`));
      
      return response.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update review result');
      setError(error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // 審査結果の詳細取得
  const getResult = (resultId: string | null) => {
    const resultUrl = jobId && resultId ? `/review-jobs/${jobId}/results/${resultId}` : null;
    const { data: resultData, error: resultError, isLoading: resultLoading } = http.get<GetReviewResultItemsResponse>(resultUrl);
    
    return {
      result: resultData?.data[0],
      isLoading: resultLoading,
      error: resultError
    };
  };

  return {
    // 階層構造データ
    hierarchy: hierarchyData?.data || [],
    isHierarchyLoading: hierarchyLoading,
    hierarchyError,
    refetchHierarchy,
    
    // 項目リストデータ
    items: itemsData?.data || [],
    isItemsLoading: itemsLoading,
    itemsError,
    refetchItems,
    
    // CRUD操作
    updateResult,
    getResult,
    
    // 状態
    isSubmitting,
    error: error || hierarchyError || itemsError
  };
};
