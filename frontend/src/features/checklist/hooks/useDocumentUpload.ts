/**
 * ドキュメントアップロード用のカスタムフック
 * ファイル選択時にpresigned URLを取得し、S3へのアップロードを行う
 */
import { useState } from 'react';
import { postData } from '../../../hooks/useFetch';

/**
 * Presigned URL レスポンス
 */
interface PresignedUrlResponse {
  url: string;
  key: string;
  documentId: string;
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
 * ドキュメントアップロードフックの戻り値
 */
interface UseDocumentUploadReturn {
  uploadDocument: (file: File) => Promise<DocumentUploadResult>;
  uploadedDocuments: DocumentUploadResult[];
  clearUploadedDocuments: () => void;
  removeDocument: (documentId: string) => void;
  isUploading: boolean;
  error: Error | null;
}

/**
 * ドキュメントアップロード用のカスタムフック
 */
export function useDocumentUpload(): UseDocumentUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<DocumentUploadResult[]>([]);

  /**
   * Presigned URLを取得する
   */
  const getPresignedUrl = async (file: File): Promise<PresignedUrlResponse> => {
    const response = await postData('/documents/presigned-url', {
      filename: file.name,
      contentType: file.type
    });
    
    if (!response.success) {
      throw new Error(`Presigned URLの取得に失敗しました: ${file.name}`);
    }
    
    return response.data;
  };

  /**
   * S3にファイルをアップロードする
   */
  const uploadToS3 = async (url: string, file: File): Promise<void> => {
    try {
      const response = await fetch(url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      });
      
      if (!response.ok) {
        throw new Error(`ファイルのアップロードに失敗しました: ${file.name} (${response.status}: ${response.statusText})`);
      }
    } catch (error) {
      console.error('S3アップロードエラー:', error);
      throw error;
    }
  };

  /**
   * ファイルをアップロードする
   * ファイル選択時に呼び出す
   */
  const uploadDocument = async (file: File): Promise<DocumentUploadResult> => {
    setIsUploading(true);
    setError(null);
    
    try {
      // Presigned URLを取得
      const presignedUrl = await getPresignedUrl(file);
      
      // S3にファイルをアップロード
      await uploadToS3(presignedUrl.url, file);
      
      const result = {
        documentId: presignedUrl.documentId,
        filename: file.name,
        s3Key: presignedUrl.key,
        fileType: file.type
      };
      
      // アップロード済みドキュメントリストに追加
      setUploadedDocuments(prev => [...prev, result]);
      
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(`ファイル ${file.name} のアップロードに失敗しました`);
      setError(err);
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * アップロード済みドキュメントリストをクリアする
   */
  const clearUploadedDocuments = () => {
    setUploadedDocuments([]);
  };

  /**
   * 特定のドキュメントを削除する
   */
  const removeDocument = (documentId: string) => {
    setUploadedDocuments(prev => prev.filter(doc => doc.documentId !== documentId));
  };

  return {
    uploadDocument,
    uploadedDocuments,
    clearUploadedDocuments,
    removeDocument,
    isUploading,
    error
  };
}
