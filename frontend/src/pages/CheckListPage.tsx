import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useChecklistSets } from '../features/checklist/hooks/useChecklistSets';
import { CheckListSetList } from '../components/checklist/CheckListSetList';

/**
 * チェックリスト一覧ページ
 */
export default function CheckListPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  const { checkListSets, total, isLoading, isError, mutate } = useChecklistSets(
    currentPage,
    itemsPerPage
  );
  
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
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-fastPulse rounded-full h-12 w-12 border-t-2 border-b-2 border-aws-sea-blue-light dark:border-aws-sea-blue-dark"></div>
        </div>
      ) : isError ? (
        <div className="bg-light-red border border-red text-red px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">エラー: </strong>
          <span className="block sm:inline">チェックリストセットの取得に失敗しました。</span>
          <button 
            onClick={() => mutate()} 
            className="underline ml-2 text-red hover:text-aws-sea-blue-light"
          >
            再試行
          </button>
        </div>
      ) : (
        <CheckListSetList checkListSets={checkListSets || []} />
      )}
    </div>
  );
}
