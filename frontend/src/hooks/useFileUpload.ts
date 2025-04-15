/**
 * ファイルアップロード関連の共通フック
 * 
 * チェックリスト管理機能で使用するファイルアップロード処理を提供します。
 * presigned URLを使用したS3へのアップロードと処理開始を一連の流れで行います。
 */

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { postData } from './useFetch';
import { GetPresignedUrlRequest, PresignedUrlResponse, StartProcessingRequest } from '../features/checklist/types';

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
  uploadSingleFile: (file: File, checkListSetId?: string) => Promise<FileUploadResult>;
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
   * @private
   */
  const getPresignedUrl = async (documentId: string, file: File, checkListSetId?: string): Promise<PresignedUrlResponse> => {
    const request: GetPresignedUrlRequest = {
      documentId,
      fileName: file.name,
      fileType: file.type,
      checkListSetId
    };
    
    const response = await postData<PresignedUrlResponse>('/documents/presigned-url', request);
    
    if (!response.success) {
      throw new Error(`Presigned URLの取得に失敗しました: ${file.name}`);
    }
    
    return response.data;
  };

  /**
   * ドキュメント処理を開始する
   * @private
   */
  const startProcessing = async (documentId: string, fileName: string): Promise<void> => {
    const request: StartProcessingRequest = {
      documentId,
      fileName
    };
    
    const response = await postData('/documents/start-processing', request);
    
    if (!response.success) {
      throw new Error(`ドキュメント処理の開始に失敗しました: ${fileName}`);
    }
  };

  /**
   * 単一ファイルをアップロードする
   */
  const uploadSingleFile = async (file: File, checkListSetId?: string): Promise<FileUploadResult> => {
    setIsUploading(true);
    setError(null);
    
    try {
      const documentId = uuidv4();
      
      // Presigned URLを取得
      const presignedUrlResponse = await getPresignedUrl(documentId, file, checkListSetId);
      
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
      await startProcessing(documentId, file.name);
      
      return {
        documentId,
        fileName: file.name,
        status: 'pending'
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(`ファイル ${file.name} のアップロードに失敗しました`);
      setError(err);
      throw err;
    } finally {
      setIsUploading(false);
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
        try {
          // 一時的にisUploadingをfalseにして、uploadSingleFileの中でtrueに戻す
          setIsUploading(false);
          const result = await uploadSingleFile(file, checkListSetId);
          results.push(result);
        } catch (error) {
          console.error(`ファイル ${file.name} のアップロードエラー:`, error);
          results.push({
            documentId: '',
            fileName: file.name,
            status: 'failed'
          });
        }
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
    uploadSingleFile,
    isUploading,
    error
  };
}
