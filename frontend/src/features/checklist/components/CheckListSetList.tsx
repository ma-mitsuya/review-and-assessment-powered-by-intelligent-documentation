import { Link } from "react-router-dom";
import { TableSkeleton } from "../../../components/Skeleton";
import {
  HiEye,
  HiTrash,
  HiExclamationCircle,
  HiInformationCircle,
  HiLockClosed,
} from "react-icons/hi";
import { CheckListStatus } from "../types";

type CheckListSetListProps = {
  checkListSets: {
    id: string;
    name: string;
    description: string;
    processingStatus: CheckListStatus;
    isEditable: boolean;
  }[];
  isLoading: boolean;
  error: string | null;
  onDelete: (id: string, name: string) => Promise<void>;
};

/**
 * チェックリストセット一覧コンポーネント
 */
export default function CheckListSetList({
  checkListSets,
  isLoading,
  error,
  onDelete,
}: CheckListSetListProps) {
  // チェックリストセットの削除処理
  const handleDelete = async (
    id: string,
    name: string,
    isEditable: boolean
  ) => {
    // 編集不可の場合は削除できない
    if (isEditable === false) {
      alert(
        "このチェックリストセットは審査ジョブに紐づいているため削除できません"
      );
      return;
    }

    if (
      confirm(`チェックリストセット「${name}」を削除してもよろしいですか？`)
    ) {
      try {
        // 削除ロジックは親コンポーネントに委譲
        await onDelete(id, name);
      } catch (error) {
        console.error("削除に失敗しました", error);
        alert("チェックリストセットの削除に失敗しました");
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
          <strong className="font-medium">エラー: </strong>
          <span className="ml-2">
            チェックリストセットの取得に失敗しました。
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
          <span>チェックリストセットがありません。</span>
        </div>
      </div>
    );
  }

  // ステータスに応じたバッジを表示する関数
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-aws-paper-light text-yellow">
            待機中
          </span>
        );
      case "in_progress": // in_progressも処理中として表示
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-aws-paper-light text-aws-font-color-blue">
            処理中
          </span>
        );
      case "completed":
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-aws-paper-light text-aws-lab">
            完了
          </span>
        );
      case "failed":
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-aws-paper-light text-red">
            失敗
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-aws-paper-light text-aws-font-color-gray">
            不明
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
                名前
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-left text-xs font-medium text-aws-font-color-gray uppercase tracking-wider"
              >
                説明
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-left text-xs font-medium text-aws-font-color-gray uppercase tracking-wider"
              >
                ステータス
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-left text-xs font-medium text-aws-font-color-gray uppercase tracking-wider"
              >
                操作
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
                          title="編集不可"
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
                      詳細
                    </Link>
                    <button
                      className={`text-red hover:text-red flex items-center ${
                        set.isEditable === false
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                      onClick={() =>
                        handleDelete(set.id, set.name, set.isEditable)
                      }
                      disabled={set.isEditable === false}
                    >
                      <HiTrash className="h-4 w-4 mr-1" />
                      削除
                    </button>
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
