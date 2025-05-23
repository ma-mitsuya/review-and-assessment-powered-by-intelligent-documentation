import { useApiClient } from "../../../hooks/useApiClient";
import type {
  GetAllChecklistSetsResponse,
  GetChecklistSetResponse,
  GetChecklistItemsResponse,
  CheckListItemDetail,
  CheckListSetDetailModel,
} from "../types";

export const getChecklistSetsKey = (
  page = 1,
  limit = 10,
  sortBy?: string,
  sortOrder?: "asc" | "desc"
) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  if (sortBy) params.append("sortBy", sortBy);
  if (sortOrder) params.append("sortOrder", sortOrder);
  return `/checklist-sets?${params.toString()}`;
};

export const getChecklistSetKey = (setId: string | null) =>
  setId ? `/checklist-sets/${setId}` : null;

export const getChecklistItemsKey = (setId: string | null) =>
  setId ? `/checklist-sets/${setId}/items` : null;

export function useChecklistSets(
  page = 1,
  limit = 10,
  sortBy?: string,
  sortOrder?: "asc" | "desc"
) {
  const url = getChecklistSetsKey(page, limit, sortBy, sortOrder);
  const { data, isLoading, error, refetch } =
    useApiClient().useQuery<GetAllChecklistSetsResponse>(url);

  return {
    items: data
      ? data.checkListSets.map(({ checkListSetId, ...rest }) => ({
          id: checkListSetId,
          ...rest,
        }))
      : [],
    total: data?.total ?? 0,
    isLoading,
    error,
    refetch,
  };
}

/**
 * チェックリストセットの詳細情報を取得するカスタムフック
 */
export function useChecklistSetDetail(setId: string | null) {
  const url = getChecklistSetKey(setId);
  const { data, isLoading, error, refetch } =
    useApiClient().useQuery<GetChecklistSetResponse>(url);

  return {
    checklistSet: data || null,
    isLoading,
    error,
    refetch,
  };
}
