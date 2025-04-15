/**
 * ファイル関連の共通型定義
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
 * ドキュメントステータス
 */
export type DocumentStatus = 'pending' | 'processing' | 'completed' | 'failed';
