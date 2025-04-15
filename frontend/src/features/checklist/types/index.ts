/**
 * チェックリスト機能の型定義
 */

import { DocumentStatus } from '../../../types/file';

/**
 * チェックリスト項目タイプ
 */
export type CheckListItemType = 'simple' | 'flow';

/**
 * フロー条件タイプ
 */
export type FlowConditionType = 'YES_NO' | 'MULTI_CHOICE';

/**
 * フローデータ
 */
export type FlowData = {
  condition_type: FlowConditionType;
  next_if_yes?: string;
  next_if_no?: string;
  options?: Array<{
    option_id: string;
    label: string;
    next_check_id: string;
  }>;
};

/**
 * メタデータ
 */
export type MetaData = {
  document_id?: string;
  page_number?: number;
  [key: string]: any;
};

/**
 * チェックリスト項目
 */
export type CheckListItem = {
  check_id: string;
  name: string;
  description?: string;
  parent_id?: string | null;
  item_type: CheckListItemType;
  is_conclusion: boolean;
  flow_data?: FlowData;
  meta_data?: MetaData;
  check_list_set_id: string;
  document_id?: string;
};

/**
 * 階層構造を持つチェックリスト項目
 */
export type HierarchicalCheckListItem = CheckListItem & {
  children: HierarchicalCheckListItem[];
};

/**
 * チェックリストセット
 */
export type CheckListSet = {
  check_list_set_id: string;
  name: string;
  description?: string;
  processing_status: 'pending' | 'in_progress' | 'completed';
  documents?: Document[];
};

/**
 * チェックリストセット詳細
 */
export type CheckListSetDetail = CheckListSet & {
  checkListItems: CheckListItem[];
};

/**
 * API レスポンス型
 */
export type ApiResponse<T> = {
  success: boolean;
  data: T;
};

export type ApiErrorResponse = {
  success: false;
  error: string;
};

/**
 * チェックリストセット一覧レスポンス
 */
export type CheckListSetsResponse = ApiResponse<{
  checkListSets: CheckListSet[];
  total: number;
}>;

/**
 * チェックリスト階層構造レスポンス
 */
export type CheckListHierarchyResponse = ApiResponse<HierarchicalCheckListItem[]>;

/**
 * チェック結果
 */
export type CheckResult = {
  result_id: string;
  check_id: string;
  document_id: string;
  result_value?: string;
  confidence_score?: number;
  extracted_text?: string;
  llm_explanation?: string;
  user_override: boolean;
  timestamp: string;
  meta_data?: MetaData;
};

/**
 * ドキュメントの型定義
 */
export type Document = {
  document_id: string;
  filename: string;
  s3_path: string;
  file_type: string;
  upload_date: string;
  check_list_set_id?: string;
  user_id?: string;
  status: DocumentStatus;
};

/**
 * チェックリストセット作成リクエスト
 */
export type CreateChecklistSetRequest = {
  name: string;
  description?: string;
  documents?: Array<{
    documentId: string;
    filename: string;
    s3Key: string;
    fileType: string;
  }>;
};

/**
 * チェックリスト項目作成リクエスト
 */
export type CreateChecklistItemRequest = {
  name: string;
  description?: string;
  parentId?: string | null;
  itemType: 'simple' | 'flow';
  isConclusion: boolean;
  flowData?: {
    condition_type: 'YES_NO' | 'MULTI_CHOICE';
    next_if_yes?: string;
    next_if_no?: string;
    options?: Array<{
      option_id: string;
      label: string;
      next_check_id: string;
    }>;
  };
  documentId?: string;
};

/**
 * チェックリスト作成状態
 */
export type ChecklistCreationState = {
  checklistSet: CheckListSet | null;
  items: CheckListItem[];
  selectedItemId: string | null;
  isEditing: boolean;
};

/**
 * チェックリストセットリストのProps
 */
export type CheckListSetListProps = {
  checkListSets: CheckListSet[];
  isLoading?: boolean;
  error?: Error;
  onDelete?: (id: string, name: string) => Promise<void>;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
};
