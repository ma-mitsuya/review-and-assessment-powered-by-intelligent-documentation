/**
 * 審査ドキュメントのアップロード機能を提供するカスタムフック
 */
import { useState } from 'react';
import { postData, deleteData } from '../../../hooks/useFetch';

export function useReviewDocumentUpload() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const getPresignedUrl = async (
    filename: string,
    contentType: string
  ): Promise<{ url: string; key: string; documentId: string }> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await postData('/documents/review/presigned-url', { 
        filename, 
        contentType 
      });
      
      return response.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to get presigned URL');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const deleteReviewDocument = async (documentId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await deleteData(`/documents/review/${documentId}`);
      return response.data.deleted;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete document');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    getPresignedUrl,
    deleteReviewDocument,
    isLoading,
    error
  };
}
