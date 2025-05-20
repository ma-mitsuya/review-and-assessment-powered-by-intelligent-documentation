import { useParams, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useChecklistSetDetail } from "../hooks/useCheckListSetQueries";
import { useDeleteChecklistSet } from "../hooks/useCheckListSetMutations";
import CheckListItemDetail from "../components/CheckListItemDetail";
import CheckListItemAddModal from "../components/CheckListItemAddModal";
import { useToast } from "../../../contexts/ToastContext";
import { DetailSkeleton } from "../../../components/Skeleton";

/**
 * チェックリストセット詳細ページ
 */
export function CheckListSetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const {
    items: checkItems,
    isLoading,
    error,
    refetch,
  } = useChecklistSetDetail(id || null);
  const {
    deleteChecklistSet,
    status: deleteStatus,
    error: deleteError,
  } = useDeleteChecklistSet();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleDelete = async () => {
    if (!id) return;

    if (confirm(`チェックリスト #${id} を削除してもよろしいですか？`)) {
      try {
        await deleteChecklistSet(id);
        addToast(`チェックリスト #${id} を削除しました`, "success");
        navigate("/checklist", { replace: true });
      } catch (error) {
        console.error("削除に失敗しました", error);
        addToast("チェックリストセットの削除に失敗しました", "error");
      }
    }
  };

  if (isLoading) {
    return <DetailSkeleton lines={6} />;
  }

  if (error) {
    return (
      <div
        className="bg-light-red border border-red text-red px-6 py-4 rounded-lg shadow-sm"
        role="alert"
      >
        <div className="flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <strong className="font-medium">エラー: </strong>
          <span className="ml-2">チェックリスト情報の取得に失敗しました。</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link
            to="/checklist"
            className="text-aws-font-color-blue hover:text-aws-sea-blue-light flex items-center mb-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            チェックリスト一覧に戻る
          </Link>
          <h1 className="text-3xl font-bold text-aws-squid-ink-light">
            チェックリスト #{id}
          </h1>
          <p className="text-aws-font-color-gray mt-2">
            チェックリスト項目:{" "}
            {Array.isArray(checkItems) ? checkItems.length : 0}件
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleDelete}
            className="bg-red hover:bg-red-dark text-aws-font-color-white-light px-5 py-2.5 rounded-md flex items-center transition-colors shadow-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            削除
          </button>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 border border-light-gray mb-8">
        {error ? (
          <div
            className="bg-light-red border border-red text-red px-6 py-4 rounded-lg shadow-sm"
            role="alert"
          >
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <strong className="font-medium">エラー: </strong>
              <span className="ml-2">
                チェックリスト項目の取得に失敗しました。
              </span>
            </div>
          </div>
        ) : !checkItems ||
          !Array.isArray(checkItems) ||
          checkItems.length === 0 ? (
          <div
            className="bg-light-yellow border border-yellow text-yellow px-6 py-4 rounded-lg shadow-sm"
            role="alert"
          >
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>このチェックリストセットには項目がありません。</span>
            </div>
          </div>
        ) : (
          <CheckListItemDetail items={checkItems} />
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-aws-sea-blue-light hover:bg-aws-sea-blue-hover-light text-aws-font-color-white-light px-5 py-2.5 rounded-md flex items-center transition-colors shadow-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            チェック項目を追加
          </button>
        </div>
      </div>

      {isAddModalOpen && (
        <CheckListItemAddModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          checkListSetId={id || ""}
          checkItems={checkItems || []}
          onSuccess={() => {
            // 追加成功時にデータを再取得
            if (id) {
              refetch();
              addToast("チェックリスト項目を追加しました", "success");
            }
          }}
        />
      )}
    </div>
  );
}

export default CheckListSetDetailPage;
