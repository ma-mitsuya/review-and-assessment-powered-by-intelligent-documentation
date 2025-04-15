/**
 * チェックリスト関連の型定義
 */

/**
 * 処理状態
 */
export type ProcessingStatus = 'pending' | 'in_progress' | 'completed';

/**
 * チェックリストセット
 */
export interface ChecklistSet {
  check_list_set_id: string;
  name: string;
  description: string | null;
  processing_status: ProcessingStatus;
}

/**
 * チェックリストセット一覧レスポンス
 */
export interface ChecklistSetsResponse {
  checkListSets: ChecklistSet[];
  total: number;
}
