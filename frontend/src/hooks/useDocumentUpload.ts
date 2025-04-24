/**
 * ドキュメントアップロード用のカスタムフック
 * ファイル選択時にpresigned URLを取得し、S3へのアップロードを行う
 */
import { useState } from 'react';
import useHttp from './useHttp';

/**
 * Presigned URL レスポンス
 */
interface PresignedUrlResponse {
  success: boolean;
  data: {
    url: string;
    key: string;
    documentId: string;
  };
  error?: string;
}

/**
 * ドキュメントアップロード結果
 */
export interface DocumentUploadResult {
  documentId: string;
  filename: string;
  s3Key: string;
  fileType: string;
}

/**
 * ドキュメントアップロード用のカスタムフック
 */
export function useDocumentUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [uploadedDocument, setUploadedDocument] = useState<DocumentUploadResult | null>(null);
  const http = useHttp();

  /**
   * ファイルをアップロードする
   * @param file アップロードするファイル
   * @returns アップロード結果
   */
  const uploadFile = async (file: File): Promise<DocumentUploadResult> => {
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    setUploadedDocument(null);
    
    try {
      // Presigned URLを取得
      const presignedResponse = await http.post<PresignedUrlResponse>('/documents/presigned-url', {
        filename: file.name,
        contentType: file.type
      });
      
      if (!presignedResponse.data.success) {
        throw new Error(presignedResponse.data.error || 'Failed to get presigned URL');
      }
      
      const { url, key, documentId } = presignedResponse.data.data;
      
      // S3にファイルをアップロード
      const uploadResponse = await fetch(url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      });
      
      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload file: ${uploadResponse.statusText}`);
      }
      
      // アップロード結果を設定
      const result: DocumentUploadResult = {
        documentId,
        filename: file.name,
        s3Key: key,
        fileType: file.type
      };
      
      setUploadedDocument(result);
      setUploadProgress(100);
      
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to upload document');
      setError(err);
      throw err;
    } finally {
      setIsUploading(false);
    }
  };
  
  /**
   * アップロードをキャンセルする
   */
  const cancelUpload = () => {
    // 実装が必要な場合はここに追加
    setIsUploading(false);
    setUploadProgress(0);
  };
  
  /**
   * アップロードしたドキュメントを削除する
   */
  const deleteUploadedDocument = async (documentId: string): Promise<boolean> => {
    try {
      const response = await http.delete<{success: boolean}>(`/documents/${documentId}`);
      
      if (uploadedDocument?.documentId === documentId) {
        setUploadedDocument(null);
      }
      
      return response.data.success;
    } catch (error) {
      console.error('Failed to delete document', error);
      return false;
    }
  };
  
  return {
    uploadFile,
    cancelUpload,
    deleteUploadedDocument,
    isUploading,
    uploadProgress,
    error,
    uploadedDocument
  };
}
