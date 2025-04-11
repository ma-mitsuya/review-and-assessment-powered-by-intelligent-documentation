/**
 * チェックリスト作成機能の型定義
 */

import { DocumentStatus } from '../../../types/file';

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
 * チェックリストセット作成リクエスト
 */
export type CreateChecklistSetRequest = {
  name: string;
  description?: string;
};

/**
 * チェックリストセット
 */
export type ChecklistSet = {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
};
