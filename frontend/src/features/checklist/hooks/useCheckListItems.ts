import useSWR from 'swr';
import { ApiResponse, CheckListItem } from '../../../types/api';
import { fetcher, postData, putData } from '../../../hooks/useFetch';

/**
 * 特定のチェックリストセットに属するチェックリスト項目を取得するカスタムフック
 */
export function useCheckListItems(checkListSetId?: string) {
  const { data, error, isLoading, mutate } = useSWR<ApiResponse<CheckListItem[]>>(
    checkListSetId ? `/checklist-sets/${checkListSetId}/items` : null,
    fetcher
  );

  return {
    data: data?.data,
    error,
    isLoading,
    mutate,
  };
}

/**
 * 特定のチェックリスト項目を取得するカスタムフック
 */
export function useCheckListItem(itemId?: string) {
  const { data, error, isLoading, mutate } = useSWR<ApiResponse<CheckListItem>>(
    itemId ? `/checklist-items/${itemId}` : null,
    fetcher
  );

  return {
    data: data?.data,
    error,
    isLoading,
    mutate,
  };
}

/**
 * チェックリスト項目を作成する関数
 */
export async function createCheckListItem(
  checkListSetId: string,
  data: Omit<CheckListItem, 'check_id'>
) {
  return await postData<CheckListItem>(`/checklist-sets/${checkListSetId}/items`, data);
}

/**
 * チェックリスト項目を更新する関数
 */
export async function updateCheckListItem(
  itemId: string,
  data: Partial<CheckListItem>
) {
  return await putData<CheckListItem>(`/checklist-items/${itemId}`, data);
}
