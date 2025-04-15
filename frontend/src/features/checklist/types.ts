/**
 * チェックリスト関連の型定義
 */

/**
 * API レスポンス
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

/**
 * チェックリストセット
 */
export interface CheckListSet {
  check_list_set_id: string;
  name: string;
  description: string | null;
  processing_status: 'pending' | 'in_progress' | 'completed';
  documents?: Document[];
}

/**
 * チェックリストセット詳細
 */
export interface CheckListSetDetail extends CheckListSet {
  checkListItems: CheckListItem[];
}

/**
 * チェックリスト項目
 */
export interface CheckListItem {
  check_id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  item_type: 'simple' | 'flow';
  is_conclusion: boolean;
  flow_data?: {
    condition_type: string;
    next_if_yes?: string;
    next_if_no?: string;
  };
  document_id?: string;
}

/**
 * ドキュメント
 */
export interface Document {
  document_id: string;
  filename: string;
  s3_path: string;
  file_type: string;
  upload_date: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}
