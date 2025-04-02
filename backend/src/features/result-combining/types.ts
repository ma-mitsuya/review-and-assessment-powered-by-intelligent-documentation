export interface CombinedPageResult {
  documentId: string;
  pageNumber: number;
}

/**
 * チェックリスト項目の構造
 */
export interface ChecklistItem {
  id: string;
  name: string;
  condition: string;
  parentId?: string;
  dependsOn?: string[];
  allRequired: boolean;
  required: boolean;
}

/**
 * チェックリスト全体の構造
 */
export interface Checklist {
  items: ChecklistItem[];
}
