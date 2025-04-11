/**
 * チェックリスト管理機能の型定義
 */

import { QueryParams, ApiResponse } from '../../core/types';

/**
 * チェックリストセットの型定義
 */
export type CheckListSet = {
  check_list_set_id: string;
  name: string;
  description: string;
  created_at?: string;
  updated_at?: string;
};

/**
 * チェックリストセット取得のクエリパラメータ
 */
export type GetCheckListSetsParams = QueryParams;

/**
 * チェックリストセット作成のリクエストボディ
 */
export type CreateCheckListSetRequest = {
  name: string;
  description: string;
};

/**
 * チェックリストセット更新のリクエストボディ
 */
export type UpdateCheckListSetRequest = {
  name?: string;
  description?: string;
};

/**
 * ドキュメントのステータス
 */
export type DocumentStatus = "pending" | "processing" | "completed" | "failed";

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
 * ドキュメント作成リクエスト
 */
export type CreateDocumentRequest = {
  filename: string;
  checkListSetId?: string;
  userId?: string;
};

/**
 * Presigned URL取得リクエスト
 */
export type GetPresignedUrlRequest = {
  filename: string;
  contentType: string;
  checkListSetId?: string;
};

/**
 * Presigned URLレスポンス
 */
export type PresignedUrlResponse = {
  url: string;
  key: string;
  documentId: string;
};

/**
 * ドキュメント処理開始リクエスト
 */
export type StartProcessingRequest = {
  documentId: string;
  fileName: string;
};

/**
 * ドキュメントステータスレスポンス
 */
export type DocumentStatusResponse = ApiResponse<{
  document: Document;
}>;

/**
 * Presigned URLリストレスポンス
 */
export type PresignedUrlListResponse = ApiResponse<{
  urls: PresignedUrlResponse[];
}>;
