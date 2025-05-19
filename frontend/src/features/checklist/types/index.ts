/**
 * チェックリスト項目
 */
export type CheckListItem = {
  checkId: string;
  name: string;
  description?: string;
  parentId?: string | null;
  isConclusion: boolean;
  checkListSetId: string;
  documentId?: string;
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
  checkListSetId: string;
  name: string;
  description?: string;
  processingStatus: "pending" | "in_progress" | "completed";
  isEditable: boolean;
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
export type ApiResponse<T> = CoreApiResponse<T>;

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
export type CheckListHierarchyResponse = ApiResponse<
  HierarchicalCheckListItem[]
>;

/**
 * チェック結果
 */
export type CheckResult = {
  resultId: string;
  checkId: string;
  documentId: string;
  resultValue?: string;
  confidenceScore?: number;
  extractedText?: string;
  llmExplanation?: string;
  userOverride: boolean;
  timestamp: string;
};

/**
 * ドキュメントの型定義
 */
export type Document = {
  documentId: string;
  filename: string;
  s3Path: string;
  fileType: string;
  uploadDate: string;
  checkListSetId?: string;
  userId?: string;
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
  isConclusion: boolean;
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
 * Presigned URL取得リクエスト
 */
export type GetPresignedUrlRequest = {
  documentId: string;
  fileName: string;
  fileType: string;
  checkListSetId?: string;
};

/**
 * Presigned URLレスポンス
 */
export type PresignedUrlResponse = {
  url: string;
  documentId: string;
  fields?: Record<string, string>;
  key?: string;
};

/**
 * ドキュメント処理開始リクエスト
 */
export type StartProcessingRequest = {
  documentId: string;
  fileName: string;
};

/**
 * ドキュメント情報
 */
export type DocumentInfo = {
  documentId: string;
  filename: string;
  status: DocumentStatus;
  createdAt?: string;
  updatedAt?: string;
  checkListSetId?: string;
};
/**
 * チェックリストセットリストのProps
 */
export type CheckListSetListProps = {
  checkListSets: CheckListSet[];
  isLoading?: boolean;
  error?: Error;
  onDelete: (id: string, name: string) => Promise<void>; // 必須プロパティに変更
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
};
