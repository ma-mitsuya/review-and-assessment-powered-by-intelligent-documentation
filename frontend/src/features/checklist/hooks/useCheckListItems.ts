import useHttp from '../../../hooks/useHttp';
import { mutate } from 'swr';
import { 
  CheckListItem, 
  HierarchicalCheckListItem, 
  ApiResponse 
} from '../types';

/**
 * チェックリスト項目の階層構造を取得するためのフック
 */
export const useCheckListItems = (setId: string | null) => {
  const http = useHttp();
  const url = setId ? `/checklist-sets/${setId}/items/hierarchy` : null;
  
  const { data, error, isLoading, mutate } = http.get<ApiResponse<HierarchicalCheckListItem[]>>(url);

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
  const http = useHttp();
  const url = setId && itemId ? `/checklist-sets/${setId}/items/${itemId}` : null;
  
  const { data, error, isLoading, mutate } = http.get<ApiResponse<CheckListItem>>(url);

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
  const http = useHttp();
  const response = await http.post<ApiResponse<CheckListItem>>(`/checklist-sets/${setId}/items`, item);
  
  // キャッシュを更新
  mutate(`/checklist-sets/${setId}`);
  mutate(`/checklist-sets/${setId}/items/hierarchy`);
  
  return response.data;
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
  const http = useHttp();
  const response = await http.put<ApiResponse<CheckListItem>>(`/checklist-sets/${setId}/items/${itemId}`, updates);
  
  // キャッシュを更新
  mutate(`/checklist-sets/${setId}`);
  mutate(`/checklist-sets/${setId}/items/hierarchy`);
  mutate(`/checklist-sets/${setId}/items/${itemId}`);
  
  return response.data;
};

/**
 * チェックリスト項目を削除する関数
 */
export const deleteCheckListItem = async (
  setId: string,
  itemId: string
): Promise<ApiResponse<{ deleted: boolean }>> => {
  const http = useHttp();
  const response = await http.delete<ApiResponse<{ deleted: boolean }>>(`/checklist-sets/${setId}/items/${itemId}`);
  
  // キャッシュを更新
  mutate(`/checklist-sets/${setId}`);
  mutate(`/checklist-sets/${setId}/items/hierarchy`);
  
  return response.data;
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
