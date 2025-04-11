/**
 * チェックリスト作成機能の型定義
 */

import { Document, DocumentStatus } from '../document-upload/types';

/**
 * チェックリストセット作成リクエスト
 */
export interface CreateChecklistSetRequest {
  name: string;
  description?: string;
}

/**
 * チェックリストセット更新リクエスト
 */
export interface UpdateChecklistSetRequest {
  name?: string;
  description?: string;
}

/**
 * チェックリストセット
 */
export interface ChecklistSet {
  checklist_set_id: string;
  name: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * チェックリストセット作成とファイルアップロードリクエスト
 */
export interface CreateChecklistWithFilesRequest {
  name: string;
  description?: string;
  fileNames: string[];
}

/**
 * チェックリストセット作成とファイルアップロードレスポンス
 */
export interface CreateChecklistWithFilesResponse {
  checklistSet: ChecklistSet;
  uploadUrls: {
    fileName: string;
    url: string;
    documentId: string;
  }[];
}

/**
 * ドキュメント処理開始リクエスト
 */
export interface StartDocumentProcessingRequest {
  fileName: string;
}
