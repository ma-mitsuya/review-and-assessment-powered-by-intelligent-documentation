export interface CombinedPageResult {
  documentId: string;
  pageNumber: number;
}

/**
 * チェックリスト項目の構造
 */
export interface ChecklistItem {
  name: string;
  description: string;
  parent_id: string | null;
  item_type: "SIMPLE" | "FLOW";
  is_conclusion: boolean;
  flow_data: FlowData | null;
}

/**
 * フローデータの構造
 */
export interface FlowData {
  condition_type: "YES_NO" | "MULTI_CHOICE";
  next_if_yes?: number;
  next_if_no?: number;
  next_options?: Record<string, number>;
}

/**
 * チェックリスト全体のレスポンス構造
 */
export interface ChecklistResponse {
  checklist_items: ChecklistItem[];
  meta_data: {
    document_id: string;
    page_number: number;
  };
}
