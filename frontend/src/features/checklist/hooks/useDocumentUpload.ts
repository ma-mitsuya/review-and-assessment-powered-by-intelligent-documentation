import { useState } from 'react';
import { ApiResponse } from '../types';
import { DocumentInfo, PresignedUrlResponse } from '../../../types/file';

const API_BASE_URL = '/api';

/**
 * ドキュメント関連の操作を行うためのフック
 */
export const useDocumentUpload = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * ドキュメントアップロード用のPresigned URLを取得
   */
  const getPresignedUrl = async (
    filename: string,
    contentType: string
  ): Promise<PresignedUrlResponse | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/documents/presigned-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename,
          contentType,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get presigned URL: ${response.statusText}`);
      }
      
      const result = await response.json() as ApiResponse<PresignedUrlResponse>;
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * ドキュメント処理を開始
   */
  const startDocumentProcessing = async (
    id: string,
    fileName: string
  ): Promise<{ started: boolean; document: DocumentInfo } | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/documents/${id}/start-processing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to start document processing: ${response.statusText}`);
      }
      
      const result = await response.json() as ApiResponse<{ started: boolean; document: DocumentInfo }>;
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * S3にファイルをアップロード
   */
  const uploadFileToS3 = async (
    presignedUrl: string,
    file: File,
    fields?: Record<string, string>
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (fields) {
        // S3 Form POSTの場合
        const formData = new FormData();
        Object.entries(fields).forEach(([key, value]) => {
          formData.append(key, value);
        });
        formData.append('file', file);

        const response = await fetch(presignedUrl, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload file: ${response.statusText}`);
        }
      } else {
        // PUT方式の場合
        const response = await fetch(presignedUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to upload file: ${response.statusText}`);
        }
      }
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    getPresignedUrl,
    startDocumentProcessing,
    uploadFileToS3,
    isLoading,
    error,
  };
};
