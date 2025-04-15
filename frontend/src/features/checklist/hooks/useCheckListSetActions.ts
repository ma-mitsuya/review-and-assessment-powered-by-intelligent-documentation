import { useState } from 'react';
import { deleteData } from '../../../hooks/useFetch';

/**
 * チェックリストセットの操作に関するフック
 */
export function useCheckListSetActions() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * チェックリストセットを削除する
   * @param id チェックリストセットID
   * @returns 削除結果
   */
  const deleteCheckListSet = async (id: string) => {
    setIsDeleting(true);
    setError(null);
    
    try {
      // /api/ プレフィックスを削除（useFetch.ts内でAPI_BASE_URLに/apiが含まれるため）
      const result = await deleteData(`/checklist-sets/${id}`);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('チェックリストセットの削除に失敗しました');
      setError(error);
      throw error;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    deleteCheckListSet,
    isDeleting,
    error
  };
}
