import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCheckListSets } from '../features/checklist/hooks/useCheckListSets';
import CheckListSetList from '../features/checklist/components/CheckListSetList';
import { deleteData } from '../hooks/useFetch';

/**
 * チェックリスト一覧ページ
 */
export default function CheckListPage() {
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
        <Link
          to="/checklist/new"
          className="bg-aws-sea-blue-light hover:bg-aws-sea-blue-hover-light dark:bg-aws-sea-blue-dark dark:hover:bg-aws-sea-blue-hover-dark text-aws-font-color-white-light px-4 py-2 rounded-md flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          新規作成
        </Link>
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
