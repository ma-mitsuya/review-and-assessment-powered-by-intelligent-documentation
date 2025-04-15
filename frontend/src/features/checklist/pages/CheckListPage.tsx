import { useState } from 'react';
import { useCheckListSets } from '../hooks/useCheckListSets';
import CheckListSetList from '../components/CheckListSetList';
import { deleteData } from '../../../hooks/useFetch';
import CreateChecklistButton from '../components/CreateChecklistButton';

/**
 * チェックリスト一覧ページ
 */
export function CheckListPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  const { checkListSets, total, isLoading, isError, mutate } = useCheckListSets(
    currentPage,
    itemsPerPage
  );
  
  // チェックリストセットの削除処理
  const handleDelete = async (id: string, name: string) => {
    try {
      await deleteData(`/api/v1/checklist-sets/${id}`);
      // 削除後にリストを再取得
      mutate();
    } catch (error) {
      console.error('削除に失敗しました', error);
      alert('チェックリストセットの削除に失敗しました');
    }
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-aws-font-color-light dark:text-aws-font-color-dark">チェックリストセット一覧</h1>
          <p className="text-aws-font-color-gray mt-2">
            不動産書類のチェックリストセットを管理します
          </p>
        </div>
        <CreateChecklistButton />
      </div>
      
      <CheckListSetList 
        checkListSets={checkListSets || []} 
        isLoading={isLoading}
        error={isError}
        onDelete={handleDelete}
        meta={{
          page: currentPage,
          limit: itemsPerPage,
          total: total
        }}
      />
    </div>
  );
}

export default CheckListPage;
