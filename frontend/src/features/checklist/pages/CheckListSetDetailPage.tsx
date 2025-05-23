import { useParams, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useChecklistSetDetail } from "../hooks/useCheckListSetQueries";
import { useDeleteChecklistSet } from "../hooks/useCheckListSetMutations";
import CheckListItemAddModal from "../components/CheckListItemAddModal";
import CheckListItemTree from "../components/CheckListItemTree";
import { useToast } from "../../../contexts/ToastContext";
import { DetailSkeleton } from "../../../components/Skeleton";
import { HiLockClosed, HiPlus, HiTrash } from "react-icons/hi";
import Button from "../../../components/Button";
import Breadcrumb from "../../../components/Breadcrumb";

/**
 * チェックリストセット詳細ページ
 */
export function CheckListSetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const {
    checklistSet,
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
          <Breadcrumb to="/checklist" label="チェックリスト一覧に戻る" />
          <h1 className="text-3xl font-bold text-aws-squid-ink-light flex items-center">
            {checklistSet ? checklistSet.name : `チェックリスト #${id}`}
            {checklistSet && !checklistSet.isEditable && (
              <div className="ml-2 text-gray-500" title="このチェックリストは編集できません">
                <HiLockClosed className="h-5 w-5" />
              </div>
            )}
          </h1>
          {checklistSet && checklistSet.description && (
            <p className="text-aws-font-color-gray mt-1">{checklistSet.description}</p>
          )}
          
          {/* ドキュメント情報を表示 */}
          {checklistSet && checklistSet.documents && checklistSet.documents.length > 0 && (
            <div className="mt-2">
              <p className="text-aws-font-color-gray">
                ドキュメント: {checklistSet.documents[0].filename}
              </p>
            </div>
          )}
        </div>
        <div className="flex space-x-3">
          {checklistSet && checklistSet.isEditable && (
            <Button
              variant="danger"
              onClick={handleDelete}
              icon={<HiTrash className="h-5 w-5" />}
            >
              削除
            </Button>
          )}
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
        ) : !id ? (
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
          <CheckListItemTree setId={id} />
        )}

        {checklistSet && (
          <div className="mt-6 flex justify-end">
            <Button
              variant="primary"
              icon={<HiPlus className="h-5 w-5" />}
              onClick={() => setIsAddModalOpen(true)}
              disabled={!checklistSet.isEditable}
              className={!checklistSet.isEditable ? "opacity-50 cursor-not-allowed" : ""}
            >
              ルート項目を追加
            </Button>
          </div>
        )}
      </div>

      {isAddModalOpen && (
        <CheckListItemAddModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          checkListSetId={id || ""}
          parentId="" // 明示的に空文字を指定してルート項目として追加
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
