import useHttp from '../../../hooks/useHttp';
import { 
  CheckListSet, 
  CheckListSetDetail,
  HierarchicalCheckListItem,
  ApiResponse 
} from '../types';

// チェックリストセット一覧のキャッシュキーを生成する関数
export const getCheckListSetsKey = (page = 1, limit = 10, sortBy?: string, sortOrder?: 'asc' | 'desc') => {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  if (sortBy) params.append('sortBy', sortBy);
  if (sortOrder) params.append('sortOrder', sortOrder);
  
  return `/checklist-sets?${params.toString()}`;
};

/**
 * チェックリストセット一覧を取得するためのフック
 */
export const useCheckListSets = (
  page = 1,
  limit = 10,
  sortBy?: string,
  sortOrder?: 'asc' | 'desc'
) => {
  const http = useHttp();
  const url = getCheckListSetsKey(page, limit, sortBy, sortOrder);
  
  const { data, error, isLoading, mutate } = http.get<ApiResponse<{ checkListSets: CheckListSet[]; total: number }>>(url);

  // 明示的にデータを再取得する関数
  const revalidate = () => mutate();

  return {
    checkListSets: data?.data.checkListSets,
    total: data?.data.total,
    isLoading,
    isError: error,
    mutate,
    revalidate,
  };
};

/**
 * チェックリスト項目の階層構造を取得するためのフック
 */
export const useCheckListItemHierarchy = (setId: string | null) => {
  const http = useHttp();
  const url = setId ? `/checklist-sets/${setId}/items/hierarchy` : null;
  
  const { data, error, isLoading, mutate } = http.get<ApiResponse<HierarchicalCheckListItem[]>>(url);

  // 明示的にデータを再取得する関数
  const revalidate = () => mutate();

  return {
    hierarchyItems: data?.data || [],
    isLoading,
    isError: error,
    mutate,
    revalidate,
  };
};

/**
 * チェックリストセット詳細を取得するためのフック
 */
export const useCheckListSet = (id: string | null) => {
  const http = useHttp();
  const url = id ? `/checklist-sets/${id}` : null;
  
  const { data, error, isLoading, mutate } = http.get<ApiResponse<CheckListSetDetail>>(url);

  // 明示的にデータを再取得する関数
  const revalidate = () => mutate();

  return {
    checkListSet: data?.data,
    isLoading,
    isError: error,
    mutate,
    revalidate,
  };
};

/**
 * チェックリストセットを作成・更新・削除するためのフック
 */
export const useCheckListSetActions = () => {
  const http = useHttp();

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
    const response = await http.post<ApiResponse<CheckListSet>>(`/checklist-sets`, {
      name,
      description,
      documents,
    });
    
    // チェックリスト一覧のキャッシュを無効化して再取得を強制
    // 正規表現を使用して、ページ番号やソート順に関わらずすべてのチェックリスト一覧キャッシュを無効化
    http.get(getCheckListSetsKey()).mutate();
    
    return response.data;
  };

  const updateCheckListSet = async (
    id: string,
    name: string,
    description?: string
  ): Promise<ApiResponse<CheckListSet>> => {
    const response = await http.put<ApiResponse<CheckListSet>>(`/checklist-sets/${id}`, {
      name,
      description,
    });
    
    // キャッシュを更新
    http.get(`/checklist-sets`).mutate();
    http.get(`/checklist-sets/${id}`).mutate();
    
    return response.data;
  };

  const deleteCheckListSet = async (id: string): Promise<ApiResponse<{ deleted: boolean }>> => {
    const response = await http.delete<ApiResponse<{ deleted: boolean }>>(`/checklist-sets/${id}`);
    
    // キャッシュを更新
    http.get(`/checklist-sets`).mutate();
    
    return response.data;
  };

  return {
    createCheckListSet,
    updateCheckListSet,
    deleteCheckListSet,
  };
};
