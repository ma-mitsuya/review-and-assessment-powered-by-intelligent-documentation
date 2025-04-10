/**
 * チェックリスト項目関連のカスタムフック
 */
import { useFetch, postData, putData, deleteData } from '../../../hooks/useFetch';
import { CheckListItem } from '../../../types/api';

/**
 * 特定のチェックリストセットに属するチェックリスト項目を取得するカスタムフック
 * @param setId チェックリストセットID
 */
export function useCheckListItems(setId: string | undefined) {
  return useFetch<CheckListItem[]>(setId ? `/checklist-sets/${setId}/items` : '');
}

/**
 * 特定のチェックリスト項目を取得するカスタムフック
 * @param itemId チェックリスト項目ID
 */
export function useCheckListItem(itemId: string | undefined) {
  return useFetch<CheckListItem>(itemId ? `/checklist-items/${itemId}` : '');
}

/**
 * チェックリスト項目を作成する関数
 * @param setId チェックリストセットID
 * @param item 作成するチェックリスト項目データ
 */
export async function createCheckListItem(setId: string, item: Omit<CheckListItem, 'check_id'>) {
  return postData<Omit<CheckListItem, 'check_id'>, CheckListItem>(`/checklist-sets/${setId}/items`, item);
}

/**
 * チェックリスト項目を更新する関数
 * @param itemId チェックリスト項目ID
 * @param item 更新するチェックリスト項目データ
 */
export async function updateCheckListItem(itemId: string, item: Partial<CheckListItem>) {
  return putData<Partial<CheckListItem>, CheckListItem>(`/checklist-items/${itemId}`, item);
}

/**
 * チェックリスト項目を削除する関数
 * @param itemId チェックリスト項目ID
 */
export async function deleteCheckListItem(itemId: string) {
  return deleteData(`/checklist-items/${itemId}`);
}
