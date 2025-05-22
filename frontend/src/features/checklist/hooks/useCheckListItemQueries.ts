import { useApiClient } from "../../../hooks/useApiClient";
import type {
  CheckListItemModel,
  CheckListItemDetailModel,
  GetChecklistSetDetailResponse,
  GetChecklistItemResponse,
} from "../types";

// 階層構造取得キー
export const getCheckListItemsKey = (
  setId: string | null,
  parentId?: string,
  includeAllChildren?: boolean
) => {
  if (!setId) return null;
  const base = `/checklist-sets/${setId}/items/hierarchy`;
  const params = new URLSearchParams();
  if (parentId) params.append("parentId", parentId);
  if (includeAllChildren) params.append("includeAllChildren", "true");
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
};

// 個別アイテム取得キー
export const getCheckListItemKey = (
  setId: string | null,
  itemId: string | null
) => (setId && itemId ? `/checklist-sets/${setId}/items/${itemId}` : null);

/**
 * チェックリスト項目（階層構造）の取得
 */
export function useCheckListItems(
  setId: string | null,
  parentId?: string,
  includeAllChildren?: boolean
) {
  const url = getCheckListItemsKey(setId, parentId, includeAllChildren);
  const { data, isLoading, error, refetch } =
    useApiClient().useQuery<GetChecklistSetDetailResponse>(url);

  return {
    items: data?.detail ?? ([] as CheckListItemDetailModel[]),
    isLoading,
    error,
    refetch,
  };
}

/**
 * チェックリスト項目（単一）の取得
 */
export function useCheckListItem(setId: string | null, itemId: string | null) {
  const url = getCheckListItemKey(setId, itemId);
  const { data, isLoading, error } =
    useApiClient().useQuery<GetChecklistItemResponse>(url);

  return {
    item: data?.detail ?? (null as CheckListItemModel | null),
    isLoading,
    error,
  };
}
