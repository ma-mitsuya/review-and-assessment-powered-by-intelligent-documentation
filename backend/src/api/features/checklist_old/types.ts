/**
 * チェックリスト項目関連の型定義
 */

/**
 * 処理状態
 */
export type ProcessingStatus = "pending" | "in_progress" | "completed";

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

/**
 * チェックリスト項目タイプ
 */
export type ChecklistItemType = "simple" | "flow";

/**
 * フローデータ型
 */
export interface FlowData {
  condition_type: "YES_NO" | string;
  next_if_yes?: string;
  next_if_no?: string;
  [key: string]: any;
}

/**
 * チェックリスト項目
 */
export interface ChecklistItem {
  check_id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  item_type: ChecklistItemType;
  is_conclusion: boolean;
  flow_data?: FlowData;
  check_list_set_id: string;
  document_id: string | null;
}

/**
 * 階層構造を持つチェックリスト項目
 */
export interface HierarchicalChecklistItem extends ChecklistItem {
  children: HierarchicalChecklistItem[];
}
