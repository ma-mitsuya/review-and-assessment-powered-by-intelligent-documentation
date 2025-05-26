/**
 * ダウンロード用のPresigned URLを取得するカスタムフック
 */
import { useState } from 'react';
import { useApiClient } from './useApiClient';

interface UsePresignedDownloadUrlOptions {
  expiresIn?: number; // 有効期限（秒）
  endpoint?: string; // エンドポイントをオプションで指定可能に
}

interface PresignedUrlResponse {
  url: string;
}

/**
 * ダウンロード用のPresigned URLを取得するカスタムフック
 * 
 * @example
 * // 基本的な使用方法（デフォルトエンドポイント）
 * const { getPresignedUrl } = usePresignedDownloadUrl();
 * const url = await getPresignedUrl('path/to/file.pdf');
 * 
 * @example
 * // 特定の機能用にエンドポイントを指定
 * const { getPresignedUrl } = usePresignedDownloadUrl({
 *   endpoint: '/documents/review/download-url'
 * });
 * const url = await getPresignedUrl('path/to/file.pdf');
 */
export function usePresignedDownloadUrl(options: UsePresignedDownloadUrlOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const apiClient = useApiClient();

  const expiresIn = options.expiresIn || 3600; // デフォルト1時間
  const endpoint = options.endpoint || '/documents/download-url'; // デフォルトエンドポイント

  /**
   * S3キーからpresigned URLを取得する
   */
  const getPresignedUrl = async (s3Key: string): Promise<string> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.useMutation<{ url: string }, { key: string, expiresIn: number }>(
        'post',
        endpoint
      ).mutateAsync({
        key: s3Key,
        expiresIn
      });
      
      return response.url;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to get presigned URL');
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * PDFのページ付きURLを取得する
   */
  const getPdfPageUrl = async (s3Key: string, pageNumber: number): Promise<string> => {
    const url = await getPresignedUrl(s3Key);
    return `${url}#page=${pageNumber}`;
  };
  
  return {
    getPresignedUrl,
    getPdfPageUrl,
    isLoading,
    error
  };
}
