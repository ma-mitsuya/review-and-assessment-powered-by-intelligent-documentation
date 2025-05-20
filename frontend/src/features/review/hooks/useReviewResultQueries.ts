import { useApiClient } from "../../../hooks/useApiClient";
import type { 
  ReviewResultDetailModel, 
  GetReviewResultItemsResponse 
} from "../types";

// FilterType の定義（components/ReviewResultFilter.ts から移動）
export type FilterType = "all" | "pass" | "fail" | "processing";

/**
 * 審査結果階層構造のキャッシュキーを生成する関数
 */
export const getReviewResultHierarchyKey = (jobId: string | null) =>
  jobId ? `/review-jobs/${jobId}/results/hierarchy` : null;

/**
 * 審査結果詳細のキャッシュキーを生成する関数
 */
export const getReviewResultDetailKey = (
  jobId: string | null,
  resultId: string | null
) => (jobId && resultId ? `/review-jobs/${jobId}/results/${resultId}` : null);

/**
 * 審査結果項目のキャッシュキーを生成する関数
 */
export const getReviewResultItemsKey = (
  jobId: string | null,
  parentId?: string,
  filter: FilterType = "all"
) => {
  if (!jobId) return null;

  let url = `/review-jobs/${jobId}/results/items`;
  const params = new URLSearchParams();

  if (parentId) {
    params.append("parentId", parentId);
  }

  if (filter && filter !== "all") {
    params.append("filter", filter);
  }

  const queryString = params.toString();
  return queryString ? `${url}?${queryString}` : url;
};

/**
 * 審査結果階層構造を取得するカスタムフック
 */
export function useReviewResultHierarchy(jobId: string | null) {
  const url = getReviewResultHierarchyKey(jobId);
  const { data, isLoading, error, refetch } =
    useApiClient().useQuery<GetReviewResultItemsResponse>(url);

  return {
    items: data?.data ?? [],
    isLoading,
    error,
    refetch,
  };
}

/**
 * 審査結果詳細を取得するカスタムフック
 */
export function useReviewResultDetail(
  jobId: string | null,
  resultId: string | null
) {
  const url = getReviewResultDetailKey(jobId, resultId);
  const { data, isLoading, error, refetch } =
    useApiClient().useQuery<GetReviewResultItemsResponse>(url);

  return {
    result: data?.data?.[0] ?? null,
    isLoading,
    error,
    refetch,
  };
}

/**
 * 審査結果項目を取得するカスタムフック
 */
export function useReviewResultItems(
  jobId: string | null,
  parentId?: string,
  filter: FilterType = "all"
) {
  const url = getReviewResultItemsKey(jobId, parentId, filter);
  const { data, isLoading, error, refetch } =
    useApiClient().useQuery<GetReviewResultItemsResponse>(url);

  return {
    items: data?.data ?? [],
    isLoading,
    error,
    refetch,
  };
}
