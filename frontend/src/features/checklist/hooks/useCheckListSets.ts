/**
 * チェックリストセット関連のカスタムフック
 */
import { useFetch } from '../../../hooks/useFetch';
import { CheckListSet } from '../../../types/api';

/**
 * チェックリストセット一覧を取得するカスタムフック
 * @param page ページ番号
 * @param limit 1ページあたりの件数
 */
export function useCheckListSets(page = 1, limit = 10) {
  return useFetch<CheckListSet[]>(`/checklist-sets?page=${page}&limit=${limit}`);
}

/**
 * 特定のチェックリストセットを取得するカスタムフック
 * @param id チェックリストセットID
 */
export function useCheckListSet(id: string | undefined) {
  return useFetch<CheckListSet>(id ? `/checklist-sets/${id}` : '');
}
