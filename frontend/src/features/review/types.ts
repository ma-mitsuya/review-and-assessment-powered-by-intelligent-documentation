/**
 * 審査機能の型定義
 */

/**
 * API レスポンスの型
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

/**
 * 審査ドキュメント
 */
export interface ReviewDocument {
  documentId: string;
  filename: string;
  s3Path: string;
  fileType: string;
  uploadDate: string;
  status: string;
}

/**
 * 審査ジョブ
 */
export interface ReviewJob {
  reviewJobId: string;
  name: string;
  status: string;
  document: {
    documentId: string;
    filename: string;
  };
  checkListSet: {
    checkListSetId: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  summary: ReviewJobSummary;
}

/**
 * 審査ジョブサマリー
 */
export interface ReviewJobSummary {
  total: number;
  passed: number;
  failed: number;
  processing?: number;
}

/**
 * 審査結果項目
 */
export interface ReviewResultItem {
  reviewResultId: string;
  reviewJobId: string; // 追加: 審査ジョブID
  checkId: string;
  status: string;
  result: string | null;
  confidenceScore: number | null;
  explanation: string | null;
  extractedText: string | null;
  userOverride: boolean;
  userComment: string | null;
  hasChildren: boolean;
  checkList: {
    checkId: string;
    name: string;
    description: string | null;
    parentId: string | null;
    isConclusion: boolean;
    flowData?: any;
  };
}

/**
 * 審査結果
 */
export interface ReviewResult {
  reviewResultId: string;
  reviewJobId: string; // 追加: 審査ジョブID
  checkId: string;
  status: string;
  result: string | null;
  confidenceScore: number | null;
  explanation: string | null;
  extractedText: string | null;
  userOverride: boolean;
  userComment: string | null;
  checkList: {
    checkId: string;
    name: string;
    description: string | null;
    parentId: string | null;
    isConclusion: boolean;
    flowData?: any;
  };
}

/**
 * 審査結果階層構造
 */
export interface ReviewResultHierarchy extends ReviewResult {
  children: ReviewResultHierarchy[];
}

/**
 * 審査ジョブ作成パラメータ
 */
export interface CreateReviewJobParams {
  name: string;
  documentId: string;
  checkListSetId: string;
  filename: string;
  s3Key: string;
  fileType: string;
}

/**
 * 審査結果更新パラメータ
 */
export interface UpdateReviewResultParams {
  result: string;
  userComment?: string;
}
