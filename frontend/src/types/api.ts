/**
 * API関連の共通型定義
 */

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
