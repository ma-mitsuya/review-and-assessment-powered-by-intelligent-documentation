/**
 * 共通型定義
 */

/**
 * ページネーションパラメータ
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * ソートパラメータ
 */
export interface SortParams {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

/**
 * ページネーション結果
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * API成功レスポンス
 */
export interface SuccessResponse<T> {
  success: true;
  data: T;
}

/**
 * API失敗レスポンス
 */
export interface ErrorResponse {
  success: false;
  error: string;
  details?: unknown;
}

/**
 * APIレスポンス型
 */
export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;
