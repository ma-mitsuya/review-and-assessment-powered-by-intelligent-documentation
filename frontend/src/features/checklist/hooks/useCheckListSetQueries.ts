import { useApiClient } from "../../../hooks/useApiClient";
import type {
  GetAllChecklistSetsResponse,
  GetChecklistSetDetailResponse,
  CheckListItemDetail,
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

export const getChecklistSetDetailKey = (setId: string | null) =>
  setId ? `/checklist-sets/${setId}/items/hierarchy` : null;

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

export function useChecklistSetDetail(setId: string | null) {
  const url = getChecklistSetDetailKey(setId);
  const { data, isLoading, error, refetch } =
    useApiClient().useQuery<GetChecklistSetDetailResponse>(url);

  return {
    items: data?.detail ?? [],
    isLoading,
    error,
    refetch,
  } as {
    items: CheckListItemDetail[];
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
  };
}
