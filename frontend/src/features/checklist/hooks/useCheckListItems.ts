import useHttp from '../../../hooks/useHttp';
import { mutate } from 'swr';
import { useState } from 'react';
import { 
  CheckListItem, 
  HierarchicalCheckListItem, 
  ApiResponse 
} from '../types';

/**
 * チェックリスト項目に関する操作をまとめたカスタムフック
 */
export const useCheckListItems = (setId: string | null) => {
  const http = useHttp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // 階層構造データの取得
  const url = setId ? `/checklist-sets/${setId}/items/hierarchy` : null;
  const { data, error: fetchError, isLoading, mutate: refetch } = http.get<ApiResponse<HierarchicalCheckListItem[]>>(url);
  
  // チェックリスト項目の作成
  const createItem = async (
    checkListSetId: string,
    item: {
      name: string;
      description?: string;
      parentId?: string;
      documentId?: string;
    }
  ): Promise<ApiResponse<CheckListItem>> => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await http.post<ApiResponse<CheckListItem>>(`/checklist-sets/${checkListSetId}/items`, item);
      
      // キャッシュを更新
      mutate(`/checklist-sets/${checkListSetId}`);
      mutate(`/checklist-sets/${checkListSetId}/items/hierarchy`);
      
      return response.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create check list item');
      setError(error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // チェックリスト項目の更新
  const updateItem = async (
    checkListSetId: string,
    itemId: string,
    updates: {
      name?: string;
      description?: string;
      documentId?: string;
    }
  ): Promise<ApiResponse<CheckListItem>> => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await http.put<ApiResponse<CheckListItem>>(`/checklist-sets/${checkListSetId}/items/${itemId}`, updates);
      
      // キャッシュを更新
      mutate(`/checklist-sets/${checkListSetId}`);
      mutate(`/checklist-sets/${checkListSetId}/items/hierarchy`);
      mutate(`/checklist-sets/${checkListSetId}/items/${itemId}`);
      
      return response.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update check list item');
      setError(error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // チェックリスト項目の削除
  const deleteItem = async (
    checkListSetId: string,
    itemId: string
  ): Promise<ApiResponse<{ deleted: boolean }>> => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await http.delete<ApiResponse<{ deleted: boolean }>>(`/checklist-sets/${checkListSetId}/items/${itemId}`);
      
      // キャッシュを更新
      mutate(`/checklist-sets/${checkListSetId}`);
      mutate(`/checklist-sets/${checkListSetId}/items/hierarchy`);
      
      return response.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete check list item');
      setError(error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // チェックリスト項目の詳細取得
  const getItem = (itemId: string | null) => {
    const itemUrl = setId && itemId ? `/checklist-sets/${setId}/items/${itemId}` : null;
    const { data: itemData, error: itemError, isLoading: itemLoading } = http.get<ApiResponse<CheckListItem>>(itemUrl);
    
    return {
      item: itemData?.data,
      isLoading: itemLoading,
      error: itemError
    };
  };

  return {
    // データ取得
    hierarchy: data?.data,
    isLoading,
    error: fetchError || error,
    refetch,
    
    // CRUD操作
    createItem,
    updateItem,
    deleteItem,
    getItem,
    
    // 状態
    isSubmitting
  };
};
