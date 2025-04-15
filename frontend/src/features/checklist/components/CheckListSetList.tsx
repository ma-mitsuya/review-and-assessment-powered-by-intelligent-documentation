import { Link, useNavigate } from 'react-router-dom';
import { useChecklistSets } from '../hooks/useChecklistSets';
import { deleteData } from '../../../hooks/useFetch';

/**
 * チェックリストセット一覧コンポーネント
 */
export default function CheckListSetList() {
  const { data: checkListSets, error, isLoading, meta, mutate } = useCheckListSets();
  const navigate = useNavigate();

  // チェックリストセットの削除処理
  const handleDelete = async (id: string, name: string) => {
    if (confirm(`チェックリストセット「${name}」を削除してもよろしいですか？`)) {
      try {
        await deleteData(`/checklist-sets/${id}`);
        // 削除後にリストを再取得
        mutate();
      } catch (error) {
        console.error('削除に失敗しました', error);
        alert('チェックリストセットの削除に失敗しました');
      }
    }
  };

  // 新規作成ページへ遷移
  const handleCreateNew = () => {
    navigate('/checklist/new');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-fastPulse rounded-full h-12 w-12 border-t-2 border-b-2 border-aws-sea-blue-light"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-light-red border border-red text-red px-6 py-4 rounded-lg shadow-sm" role="alert">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <strong className="font-medium">エラー: </strong>
          <span className="ml-2">チェックリストセットの取得に失敗しました。</span>
        </div>
      </div>
    );
  }

  if (!checkListSets || checkListSets.length === 0) {
    return (
      <div className="bg-light-yellow border border-yellow text-yellow px-6 py-4 rounded-lg shadow-sm" role="alert">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>チェックリストセットがありません。</span>
        </div>
      </div>
    );
  }

  // ステータスに応じたバッジを表示する関数
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
            待機中
          </span>
        );
      case 'processing':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
            処理中
          </span>
        );
      case 'completed':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
            完了
          </span>
        );
      case 'failed':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
            失敗
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
            不明
          </span>
        );
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-semibold text-aws-squid-ink-light">チェックリストセット一覧</h2>
        <button
          onClick={handleCreateNew}
          className="bg-aws-sea-blue-light hover:bg-aws-sea-blue-hover-light text-aws-font-color-white-light px-5 py-2.5 rounded-md flex items-center transition-colors shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          新規作成
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-light-gray">
        <table className="min-w-full divide-y divide-light-gray">
          <thead className="bg-aws-paper-light">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-aws-font-color-gray uppercase tracking-wider">
                名前
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-aws-font-color-gray uppercase tracking-wider">
                説明
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-aws-font-color-gray uppercase tracking-wider">
                ステータス
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-aws-font-color-gray uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-light-gray">
            {checkListSets.map((set) => (
              <tr key={set.check_list_set_id} className="hover:bg-aws-paper-light transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-aws-squid-ink-light">{set.name}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-aws-font-color-gray">{set.description}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {set.documents && set.documents.length > 0 ? (
                    <div className="flex flex-col space-y-1">
                      {set.documents.map((doc) => (
                        <div key={doc.document_id} className="flex items-center">
                          {renderStatusBadge(doc.status)}
                          <span className="ml-2 text-xs text-aws-font-color-gray truncate max-w-xs">
                            {doc.filename}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-aws-font-color-gray">ドキュメントなし</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center space-x-3">
                    <Link
                      to={`/checklist/${set.check_list_set_id}`}
                      className="text-aws-font-color-blue hover:text-aws-sea-blue-light flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                      詳細
                    </Link>
                    <Link
                      to={`/checklist/${set.check_list_set_id}/edit`}
                      className="text-aws-aqua hover:text-aws-sea-blue-light flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                      編集
                    </Link>
                    <button
                      className="text-red hover:text-red flex items-center"
                      onClick={() => handleDelete(set.check_list_set_id, set.name)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      削除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ページネーション */}
      {meta && meta.total && meta.limit && meta.total > meta.limit && (
        <div className="flex justify-center mt-8">
          <nav className="inline-flex rounded-md shadow-sm">
            {/* ページネーションコントロール */}
            <button
              disabled={meta.page === 1}
              className="px-4 py-2 rounded-l-md border border-light-gray bg-white text-sm font-medium text-aws-squid-ink-light hover:bg-aws-paper-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              前へ
            </button>
            <span className="px-4 py-2 border-t border-b border-light-gray bg-white text-sm font-medium text-aws-squid-ink-light">
              {meta.page || 1} / {Math.ceil(meta.total / meta.limit)}
            </span>
            <button
              disabled={!meta.page || meta.page >= Math.ceil(meta.total / meta.limit)}
              className="px-4 py-2 rounded-r-md border border-light-gray bg-white text-sm font-medium text-aws-squid-ink-light hover:bg-aws-paper-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              次へ
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
