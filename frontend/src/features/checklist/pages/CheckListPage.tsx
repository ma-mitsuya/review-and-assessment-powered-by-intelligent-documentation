import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useCheckListSets, useCheckListSetActions } from '../hooks/useCheckListSets';
import { useToast } from '../../../contexts/ToastContext';
import CheckListSetList from '../components/CheckListSetList';
import CreateChecklistButton from '../components/CreateChecklistButton';

/**
 * チェックリスト一覧ページ
 */
export function CheckListPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const location = useLocation();
  const { addToast } = useToast();
  
  const { checkListSets, total, isLoading, isError, mutate, revalidate } = useCheckListSets(
    currentPage,
    itemsPerPage
  );
  
  const { deleteCheckListSet } = useCheckListSetActions();
  
  // 画面表示時またはlocationが変わった時にデータを再取得
  useEffect(() => {
    // 新規作成後に一覧画面に戻ってきた場合など、locationが変わった時にデータを再取得
    revalidate();
  }, [location, revalidate]);
  
  // チェックリストセットの削除処理
  const handleDelete = async (id: string, name: string) => {
    try {
      await deleteCheckListSet(id);
      // 削除後にリストを再取得
      mutate();
      // 削除成功のトースト通知を表示
      addToast(`チェックリスト「${name}」を削除しました`, 'success');
    } catch (error) {
      console.error('削除に失敗しました', error);
      // 削除失敗のトースト通知を表示
      addToast('チェックリストセットの削除に失敗しました', 'error');
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
