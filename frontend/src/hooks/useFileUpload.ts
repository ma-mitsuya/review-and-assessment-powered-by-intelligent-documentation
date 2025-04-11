/**
 * ファイルアップロード関連の共通フック
 */

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { postData } from './useFetch';
import { GetPresignedUrlRequest, PresignedUrlResponse, StartProcessingRequest } from '../types/file';

/**
 * ファイルアップロード結果
 */
export interface FileUploadResult {
  documentId: string;
  fileName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

/**
 * ファイルアップロードフックの戻り値
 */
interface UseFileUploadReturn {
  uploadFiles: (files: File[], checkListSetId?: string) => Promise<FileUploadResult[]>;
  getPresignedUrl: (request: GetPresignedUrlRequest) => Promise<PresignedUrlResponse>;
  startProcessing: (request: StartProcessingRequest) => Promise<void>;
  isUploading: boolean;
  error: Error | null;
}

/**
 * ファイルアップロード関連の共通フック
 */
export function useFileUpload(): UseFileUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Presigned URLを取得する
   */
  const getPresignedUrl = async (request: GetPresignedUrlRequest): Promise<PresignedUrlResponse> => {
    const response = await postData<PresignedUrlResponse>('/documents/presigned-url', request);
    
    if (!response.success) {
      throw new Error(`Presigned URLの取得に失敗しました: ${request.fileName}`);
    }
    
    return response.data;
  };

  /**
   * ドキュメント処理を開始する
   */
  const startProcessing = async (request: StartProcessingRequest): Promise<void> => {
    const response = await postData('/documents/start-processing', request);
    
    if (!response.success) {
      throw new Error(`ドキュメント処理の開始に失敗しました: ${request.fileName}`);
    }
  };

  /**
   * 複数ファイルをアップロードする
   */
  const uploadFiles = async (files: File[], checkListSetId?: string): Promise<FileUploadResult[]> => {
    setIsUploading(true);
    setError(null);
    
    try {
      const results: FileUploadResult[] = [];
      
      for (const file of files) {
        const documentId = uuidv4();
        
        // Presigned URLを取得
        const presignedUrlRequest: GetPresignedUrlRequest = {
          documentId,
          fileName: file.name,
          fileType: file.type,
          checkListSetId
        };
        
        const presignedUrlResponse = await getPresignedUrl(presignedUrlRequest);
        
        // S3にファイルをアップロード
        const { url, fields } = presignedUrlResponse;
        
        const formData = new FormData();
        
        // S3に必要なフィールドを追加
        if (fields) {
          Object.entries(fields).forEach(([key, value]) => {
            formData.append(key, value);
          });
        }
        
        // ファイルを追加
        formData.append('file', file);
        
        // S3に直接アップロード
        const uploadResponse = await fetch(url, {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          throw new Error(`ファイルのアップロードに失敗しました: ${file.name}`);
        }
        
        // ドキュメント処理を開始
        const startProcessingRequest: StartProcessingRequest = {
          documentId,
          fileName: file.name
        };
        
        await startProcessing(startProcessingRequest);
        
        results.push({
          documentId,
          fileName: file.name,
          status: 'pending'
        });
      }
      
      return results;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('ファイルのアップロードに失敗しました');
      setError(err);
      throw err;
    } finally {
      setIsUploading(false);
    }
  };
  
  return {
    uploadFiles,
    getPresignedUrl,
    startProcessing,
    isUploading,
    error
  };
}
