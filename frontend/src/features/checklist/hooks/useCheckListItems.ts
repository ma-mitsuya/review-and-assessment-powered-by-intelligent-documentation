import useSWR, { mutate } from 'swr';
import { 
  CheckListItem, 
  HierarchicalCheckListItem, 
  ApiResponse 
} from '../types';

const API_BASE_URL = '/api';

/**
 * チェックリスト項目の階層構造を取得するためのフック
 */
export const useChecklistHierarchy = (setId: string | null) => {
  const url = setId ? `${API_BASE_URL}/checklist-sets/${setId}/items/hierarchy` : null;
  
  const fetcher = async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch checklist hierarchy: ${response.statusText}`);
    }
    return response.json();
  };

  const { data, error, isLoading, mutate } = useSWR<ApiResponse<HierarchicalCheckListItem[]>>(
    url,
    fetcher
  );

  return {
    hierarchy: data?.data,
    isLoading,
    isError: error,
    mutate,
  };
};

/**
 * チェックリスト項目詳細を取得するためのフック
 */
export const useChecklistItem = (setId: string | null, itemId: string | null) => {
  const url = setId && itemId ? `${API_BASE_URL}/checklist-sets/${setId}/items/${itemId}` : null;
  
  const fetcher = async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch checklist item: ${response.statusText}`);
    }
    return response.json();
  };

  const { data, error, isLoading, mutate } = useSWR<ApiResponse<CheckListItem>>(
    url,
    fetcher
  );

  return {
    checkListItem: data?.data,
    isLoading,
    isError: error,
    mutate,
  };
};

/**
 * チェックリスト項目を操作するためのフック
 */
export const useChecklistItemMutations = (setId: string) => {
  const createCheckListItem = async (
    item: {
      name: string;
      description?: string;
      parentId?: string;
      itemType: 'simple' | 'flow';
      isConclusion: boolean;
      flowData?: {
        condition_type: 'YES_NO' | 'MULTI_CHOICE';
        next_if_yes?: string;
        next_if_no?: string;
        options?: Array<{
          option_id: string;
          label: string;
          next_check_id: string;
        }>;
      };
      documentId?: string;
    }
  ): Promise<ApiResponse<CheckListItem>> => {
    const response = await fetch(`${API_BASE_URL}/checklist-sets/${setId}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create checklist item: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // キャッシュを更新
    mutate(`${API_BASE_URL}/checklist-sets/${setId}`);
    mutate(`${API_BASE_URL}/checklist-sets/${setId}/items/hierarchy`);
    
    return result;
  };

  const updateCheckListItem = async (
    itemId: string,
    updates: {
      name?: string;
      description?: string;
      isConclusion?: boolean;
      flowData?: {
        condition_type: 'YES_NO' | 'MULTI_CHOICE';
        next_if_yes?: string;
        next_if_no?: string;
        options?: Array<{
          option_id: string;
          label: string;
          next_check_id: string;
        }>;
      };
      documentId?: string;
    }
  ): Promise<ApiResponse<CheckListItem>> => {
    const response = await fetch(`${API_BASE_URL}/checklist-sets/${setId}/items/${itemId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update checklist item: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // キャッシュを更新
    mutate(`${API_BASE_URL}/checklist-sets/${setId}`);
    mutate(`${API_BASE_URL}/checklist-sets/${setId}/items/hierarchy`);
    mutate(`${API_BASE_URL}/checklist-sets/${setId}/items/${itemId}`);
    
    return result;
  };

  const deleteCheckListItem = async (
    itemId: string
  ): Promise<ApiResponse<{ deleted: boolean }>> => {
    const response = await fetch(`${API_BASE_URL}/checklist-sets/${setId}/items/${itemId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete checklist item: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // キャッシュを更新
    mutate(`${API_BASE_URL}/checklist-sets/${setId}`);
    mutate(`${API_BASE_URL}/checklist-sets/${setId}/items/hierarchy`);
    
    return result;
  };

  return {
    createCheckListItem,
    updateCheckListItem,
    deleteCheckListItem,
  };
};
