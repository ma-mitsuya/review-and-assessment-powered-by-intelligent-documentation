import useSWR from 'swr';
import { ApiResponse, CheckListSet } from '../../../types/api';
import { fetcher } from '../../../hooks/useFetch';

/**
 * チェックリストセット一覧を取得するカスタムフック
 */
export function useCheckListSets() {
  const { data, error, isLoading, mutate } = useSWR<ApiResponse<CheckListSet[]>>(
    '/checklist-sets',
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
 * 特定のチェックリストセットを取得するカスタムフック
 */
export function useCheckListSet(id?: string) {
  const { data, error, isLoading, mutate } = useSWR<ApiResponse<CheckListSet>>(
    id ? `/checklist-sets/${id}` : null,
    fetcher
  );

  return {
    data: data?.data,
    error,
    isLoading,
    mutate,
  };
}
