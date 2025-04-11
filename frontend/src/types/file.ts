/**
 * ファイル関連の共通型定義
 * 
 * チェックリスト管理機能で使用するファイルアップロード関連の型定義
 */

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
 * ドキュメントステータス
 */
export type DocumentStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * ドキュメント情報
 */
export type DocumentInfo = {
  document_id: string;
  filename: string;
  status: DocumentStatus;
  created_at?: string;
  updated_at?: string;
  check_list_set_id?: string;
};
