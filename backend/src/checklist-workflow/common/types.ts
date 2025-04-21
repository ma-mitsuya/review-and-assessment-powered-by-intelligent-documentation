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
  parent_id: string | null;
  item_type: "SIMPLE" | "FLOW";
  is_conclusion: boolean;
  id: string; // IDフィールドを必須に変更
  flow_data?: {
    condition_type: "YES_NO" | "MULTI_CHOICE";
    next_if_yes?: string;
    next_if_no?: string;
    next_options?: Record<string, string>;
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
