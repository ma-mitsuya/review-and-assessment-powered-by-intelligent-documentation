import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TableSkeleton } from "../../../components/Skeleton";
import {
  HiEye,
  HiTrash,
  HiExclamationCircle,
  HiInformationCircle,
  HiLockClosed,
  HiDuplicate,
} from "react-icons/hi";
import { CHECK_LIST_STATUS } from "../types";
import Button from "../../../components/Button";

type CheckListSetListProps = {
  checkListSets: {
    id: string;
    name: string;
    description: string;
    processingStatus: CHECK_LIST_STATUS;
    isEditable: boolean;
  }[];
  isLoading: boolean;
  error: string | null;
  onDelete: (id: string, name: string) => Promise<void>;
  onDuplicate: (id: string, name: string) => void; // 複製ハンドラーを追加
};

/**
 * チェックリストセット一覧コンポーネント
 */
export default function CheckListSetList({
  checkListSets,
  isLoading,
  error,
  onDelete,
  onDuplicate,
}: CheckListSetListProps) {
  const { t } = useTranslation();
  
  // チェックリストセットの削除処理
  const handleDelete = async (
    id: string,
    name: string,
    isEditable: boolean
  ) => {
    // 編集不可の場合は削除できない
    if (isEditable === false) {
      alert(t('checklist.notEditable'));
      return;
    }

    if (
      confirm(t('checklist.deleteConfirmation', { name }))
    ) {
      try {
        // 削除ロジックは親コンポーネントに委譲
        await onDelete(id, name);
      } catch (error) {
        console.error("削除に失敗しました", error);
        alert(t('checklist.deleteError'));
      }
    }
  };

  if (isLoading) {
    return <TableSkeleton rows={5} columns={4} />;
  }

  if (error) {
    return (
      <div
        className="bg-light-red border border-red text-red px-6 py-4 rounded-lg shadow-sm"
        role="alert"
      >
        <div className="flex items-center">
          <HiExclamationCircle className="h-6 w-6 mr-2" />
          <strong className="font-medium">{t('common.error')}: </strong>
          <span className="ml-2">
            {t('checklist.loadError')}
          </span>
        </div>
      </div>
    );
  }

  if (!checkListSets || checkListSets.length === 0) {
    return (
      <div
        className="bg-light-yellow border border-yellow text-yellow px-6 py-4 rounded-lg shadow-sm"
        role="alert"
      >
        <div className="flex items-center">
          <HiInformationCircle className="h-6 w-6 mr-2" />
          <span>{t('checklist.noChecklists')}</span>
        </div>
      </div>
    );
  }

  // ステータスに応じたバッジを表示する関数
  const renderStatusBadge = (status: CHECK_LIST_STATUS) => {
    switch (status) {
      case CHECK_LIST_STATUS.PENDING:
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-aws-paper-light text-yellow">
            {t('status.pending')}
          </span>
        );
      case CHECK_LIST_STATUS.PROCESSING:
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-aws-paper-light text-aws-font-color-blue">
            {t('status.processing')}
          </span>
        );
      case CHECK_LIST_STATUS.COMPLETED:
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-aws-paper-light text-aws-lab">
            {t('status.completed')}
          </span>
        );
      case CHECK_LIST_STATUS.FAILED:
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-aws-paper-light text-red">
            {t('status.failed')}
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-aws-paper-light text-aws-font-color-gray">
            {t('status.unknown')}
          </span>
        );
    }
  };

  return (
    <div>
      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-light-gray">
        <table className="min-w-full divide-y divide-light-gray">
          <thead className="bg-aws-paper-light">
            <tr>
              <th
                scope="col"
                className="px-6 py-4 text-left text-xs font-medium text-aws-font-color-gray uppercase tracking-wider"
              >
                {t('checklist.name')}
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-left text-xs font-medium text-aws-font-color-gray uppercase tracking-wider"
              >
                {t('checklist.description')}
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-left text-xs font-medium text-aws-font-color-gray uppercase tracking-wider"
              >
                {t('checklist.status')}
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-left text-xs font-medium text-aws-font-color-gray uppercase tracking-wider"
              >
                {t('checklist.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-light-gray">
            {checkListSets.map((set) => (
              <tr
                key={set.id}
                className="hover:bg-aws-paper-light transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="text-sm font-medium text-aws-squid-ink-light">
                      {set.name}
                    </div>
                    {/* 編集不可の場合に鍵アイコンを表示 */}
                    {set.isEditable === false && (
                      <div className="ml-2 text-gray-500">
                        <HiLockClosed
                          className="h-5 w-5"
                          title={t('checklist.notEditable')}
                        />
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div
                    className="text-sm text-aws-font-color-gray max-w-xs truncate"
                    title={set.description} // ホバー時にツールチップで全文表示
                  >
                    {set.description}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {/* ドキュメント情報がある場合はそれを表示、なければprocessingStatusを表示 */}
                  <div className="flex items-center">
                    {renderStatusBadge(set.processingStatus)}
                    {set.documents && set.documents.length > 0 && (
                      <span className="ml-2 text-xs text-aws-font-color-gray truncate max-w-xs">
                        {set.documents.map((doc) => doc.filename).join(", ")}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center space-x-3">
                    <Link
                      to={`/checklist/${set.id}`}
                      className="text-aws-font-color-blue hover:text-aws-sea-blue-light flex items-center"
                    >
                      <HiEye className="h-4 w-4 mr-1" />
                      {t('common.details')}
                    </Link>
                    {/* 複製ボタンを追加 - 編集可能かどうかに関わらず表示 */}
                    <Button
                      variant="text"
                      size="sm"
                      icon={<HiDuplicate className="h-4 w-4" />}
                      onClick={() => onDuplicate(set.id, set.name)}
                      className="text-aws-font-color-blue hover:text-aws-sea-blue-light"
                    >
                      {t('common.duplicate')}
                    </Button>
                    <Button
                      variant="text"
                      size="sm"
                      icon={<HiTrash className="h-4 w-4" />}
                      onClick={() => handleDelete(set.id, set.name, set.isEditable)}
                      disabled={set.isEditable === false}
                      className={`text-red hover:text-red ${
                        set.isEditable === false ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      {t('common.delete')}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
