/**
 * API関連の型定義
 */

/**
 * API レスポンスの共通型
 */
export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
};

/**
 * チェックリストセットの型定義
 */
export type CheckListSet = {
  check_list_set_id: string;
  name: string;
  description: string;
};

/**
 * チェックリスト項目の型定義
 */
export type CheckListItem = {
  check_id: string;
  name: string;
  description: string;
  parent_id?: string;
  check_list_set_id: string;
  item_type: 'SIMPLE' | 'FLOW';
  is_conclusion: boolean;
  flow_data?: {
    next_if_yes?: string;
    next_if_no?: string;
    condition_type: string;
  };
  meta_data?: Record<string, any>;
};
