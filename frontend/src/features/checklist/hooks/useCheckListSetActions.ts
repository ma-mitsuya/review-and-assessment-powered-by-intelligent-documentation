/**
 * チェックリストセット操作関連のカスタムフック
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postData, putData, deleteData } from '../../../hooks/useFetch';
import { CheckListSet } from '../../../types/api';

/**
 * チェックリストセットの作成、更新、削除を行うカスタムフック
 */
export function useCheckListSetActions() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * チェックリストセットを作成する
   * @param data 作成するチェックリストセットのデータ
   */
  const createCheckListSet = async (data: { name: string; description: string }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await postData<typeof data, CheckListSet>('/checklist-sets', data);
      setIsLoading(false);
      return response.data;
    } catch (err) {
      setError('チェックリストセットの作成に失敗しました');
      setIsLoading(false);
      throw err;
    }
  };

  /**
   * チェックリストセットを更新する
   * @param id チェックリストセットID
   * @param data 更新するチェックリストセットのデータ
   */
  const updateCheckListSet = async (id: string, data: { name?: string; description?: string }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await putData<typeof data, CheckListSet>(`/checklist-sets/${id}`, data);
      setIsLoading(false);
      return response.data;
    } catch (err) {
      setError('チェックリストセットの更新に失敗しました');
      setIsLoading(false);
      throw err;
    }
  };

  /**
   * チェックリストセットを削除する
   * @param id チェックリストセットID
   */
  const deleteCheckListSet = async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await deleteData(`/checklist-sets/${id}`);
      setIsLoading(false);
      navigate('/checklist', { replace: true });
      return true;
    } catch (err) {
      setError('チェックリストセットの削除に失敗しました');
      setIsLoading(false);
      throw err;
    }
  };

  return {
    createCheckListSet,
    updateCheckListSet,
    deleteCheckListSet,
    isLoading,
    error
  };
}
