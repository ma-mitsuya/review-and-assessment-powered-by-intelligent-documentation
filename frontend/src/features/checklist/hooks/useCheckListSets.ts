import useSWR, { mutate } from 'swr';
import { 
  CheckListSet, 
  CheckListSetDetail, 
  ApiResponse 
} from '../types';

const API_BASE_URL = '/api';

/**
 * チェックリストセット一覧を取得するためのフック
 */
export const useCheckListSets = (
  page = 1,
  limit = 10,
  sortBy?: string,
  sortOrder?: 'asc' | 'desc'
) => {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  if (sortBy) params.append('sortBy', sortBy);
  if (sortOrder) params.append('sortOrder', sortOrder);

  const url = `${API_BASE_URL}/checklist-sets?${params.toString()}`;
  
  const fetcher = async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch checklist sets: ${response.statusText}`);
    }
    return response.json();
  };

  const { data, error, isLoading, mutate } = useSWR<ApiResponse<{ checkListSets: CheckListSet[]; total: number }>>(
    url,
    fetcher
  );

  return {
    checkListSets: data?.data.checkListSets,
    total: data?.data.total,
    isLoading,
    isError: error,
    mutate,
  };
};

/**
 * チェックリストセット詳細を取得するためのフック
 */
export const useCheckListSet = (id: string | null) => {
  const url = id ? `${API_BASE_URL}/checklist-sets/${id}` : null;
  
  const fetcher = async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch checklist set detail: ${response.statusText}`);
    }
    return response.json();
  };

  const { data, error, isLoading, mutate } = useSWR<ApiResponse<CheckListSetDetail>>(
    url,
    fetcher
  );

  return {
    checkListSet: data?.data,
    isLoading,
    isError: error,
    mutate,
  };
};

/**
 * チェックリストセットを作成・更新・削除するためのフック
 */
export const useCheckListSetActions = () => {
  const createCheckListSet = async (
    name: string,
    description?: string,
    documents?: Array<{
      documentId: string;
      filename: string;
      s3Key: string;
      fileType: string;
    }>
  ): Promise<ApiResponse<CheckListSet>> => {
    const response = await fetch(`${API_BASE_URL}/checklist-sets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        description,
        documents,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create checklist set: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // キャッシュを更新
    mutate(`${API_BASE_URL}/checklist-sets`);
    
    return result;
  };

  const updateCheckListSet = async (
    id: string,
    name: string,
    description?: string
  ): Promise<ApiResponse<CheckListSet>> => {
    const response = await fetch(`${API_BASE_URL}/checklist-sets/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        description,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update checklist set: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // キャッシュを更新
    mutate(`${API_BASE_URL}/checklist-sets`);
    mutate(`${API_BASE_URL}/checklist-sets/${id}`);
    
    return result;
  };

  const deleteCheckListSet = async (id: string): Promise<ApiResponse<{ deleted: boolean }>> => {
    const response = await fetch(`${API_BASE_URL}/checklist-sets/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete checklist set: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // キャッシュを更新
    mutate(`${API_BASE_URL}/checklist-sets`);
    
    return result;
  };

  return {
    createCheckListSet,
    updateCheckListSet,
    deleteCheckListSet,
  };
};
