/**
 * チェックリストワークフロー共通の型定義
 */

export interface ProcessDocumentResult {
  documentId: string;
  pageCount: number;
  pages: { pageNumber: number }[];
}

export interface ExtractTextResult {
  documentId: string;
  pageNumber: number;
}

export interface ChecklistItem {
  name: string;
  description: string;
  parent_id: number | string | null;
  item_type: "SIMPLE" | "FLOW";
  is_conclusion: boolean;
  flow_data?: {
    condition_type: "YES_NO" | "MULTI_CHOICE";
    next_if_yes?: number | string;
    next_if_no?: number | string;
    next_options?: Record<string, number | string>;
  };
}

export interface ProcessWithLLMResult {
  documentId: string;
  pageNumber: number;
}

export interface CombinePageResult {
  documentId: string;
  pageNumber: number;
}

export interface AggregatePageResult {
  documentId: string;
}
