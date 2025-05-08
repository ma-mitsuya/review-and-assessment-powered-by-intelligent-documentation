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
  document_id: string;
  filename: string;
  s3_path: string;
  file_type: string;
  upload_date: string;
  status: string;
}

/**
 * 審査ジョブ
 */
export interface ReviewJob {
  review_job_id: string;
  name: string;
  status: string;
  document: {
    document_id: string;
    filename: string;
  };
  check_list_set: {
    check_list_set_id: string;
    name: string;
  };
  created_at: string;
  updated_at: string;
  completed_at: string | null;
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
  review_result_id: string;
  review_job_id: string;  // 追加: 審査ジョブID
  check_id: string;
  status: string;
  result: string | null;
  confidence_score: number | null;
  explanation: string | null;
  extracted_text: string | null;
  user_override: boolean;
  user_comment: string | null;
  has_children: boolean;
  check_list: {
    check_id: string;
    name: string;
    description: string | null;
    parent_id: string | null;
    item_type: string;
    is_conclusion: boolean;
    flow_data?: any;
  };
}

/**
 * 審査結果
 */
export interface ReviewResult {
  review_result_id: string;
  review_job_id: string;  // 追加: 審査ジョブID
  check_id: string;
  status: string;
  result: string | null;
  confidence_score: number | null;
  explanation: string | null;
  extracted_text: string | null;
  user_override: boolean;
  user_comment: string | null;
  check_list: {
    check_id: string;
    name: string;
    description: string | null;
    parent_id: string | null;
    item_type: string;
    is_conclusion: boolean;
    flow_data?: any;
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
