/**
 * 共通型定義
 */

/**
 * クエリパラメータの共通型
 */
export type QueryParams = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

/**
 * API レスポンスの共通型
 */
export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
};
