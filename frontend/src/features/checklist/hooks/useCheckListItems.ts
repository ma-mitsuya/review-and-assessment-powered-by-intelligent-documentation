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
export const useCheckListItems = (setId: string | null) => {
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
export const useCheckListItem = (setId: string | null, itemId: string | null) => {
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
 * チェックリスト項目を作成する関数
 */
export const createCheckListItem = async (
  setId: string,
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

/**
 * チェックリスト項目を更新する関数
 */
export const updateCheckListItem = async (
  setId: string,
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

/**
 * チェックリスト項目を削除する関数
 */
export const deleteCheckListItem = async (
  setId: string,
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

/**
 * チェックリスト項目を操作するためのフック
 */
export const useCheckListItemMutations = (setId: string) => {
  return {
    createCheckListItem: (item: Parameters<typeof createCheckListItem>[1]) => 
      createCheckListItem(setId, item),
    updateCheckListItem: (itemId: string, updates: Parameters<typeof updateCheckListItem>[2]) => 
      updateCheckListItem(setId, itemId, updates),
    deleteCheckListItem: (itemId: string) => 
      deleteCheckListItem(setId, itemId),
  };
};
