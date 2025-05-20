import React from 'react';
import { ReviewJobMetaModel, REVIEW_JOB_STATUS } from '../types';
import { useDeleteReviewJob } from '../hooks/useReviewJobMutations';
import { TableSkeleton } from '../../../components/Skeleton';
import { HiEye, HiTrash, HiInformationCircle } from 'react-icons/hi';

interface ReviewJobListProps {
  jobs: ReviewJobMetaModel[];
  onJobClick?: (job: ReviewJobMetaModel) => void;
  revalidate?: () => void;
  isLoading?: boolean;
}

export const ReviewJobList: React.FC<ReviewJobListProps> = ({ jobs, onJobClick, revalidate, isLoading }) => {
  const { deleteReviewJob, status } = useDeleteReviewJob();
  const isDeleting = status === 'loading';

  const handleDelete = async (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (confirm('この審査ジョブを削除してもよろしいですか？')) {
      try {
        await deleteReviewJob(jobId);
        // 削除後にデータを再取得
        if (revalidate) {
          revalidate();
        }
      } catch (error) {
        alert('審査ジョブの削除に失敗しました');
        console.error(error);
      }
    }
  };

  if (isLoading) {
    return <TableSkeleton rows={5} columns={6} />;
  }

  if (jobs.length === 0) {
    return (
      <div className="bg-light-yellow border border-yellow text-yellow px-6 py-4 rounded-lg shadow-sm" role="alert">
        <div className="flex items-center">
          <HiInformationCircle className="h-6 w-6 mr-2" />
          <span>審査ジョブがありません。</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden border border-light-gray">
      <table className="min-w-full divide-y divide-light-gray">
        <thead className="bg-aws-paper-light">
          <tr>
            <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-aws-font-color-gray uppercase tracking-wider">
              名前
            </th>
            <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-aws-font-color-gray uppercase tracking-wider">
              ドキュメント
            </th>
            <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-aws-font-color-gray uppercase tracking-wider">
              チェックリスト
            </th>
            <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-aws-font-color-gray uppercase tracking-wider">
              ステータス
            </th>
            <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-aws-font-color-gray uppercase tracking-wider">
              作成日時
            </th>
            <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-aws-font-color-gray uppercase tracking-wider">
              操作
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-light-gray">
          {jobs.map((job) => (
            <tr 
              key={job.id} 
              className="hover:bg-aws-paper-light transition-colors"
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-aws-squid-ink-light">{job.name}</div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-aws-font-color-gray">{job.document.filename}</div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-aws-font-color-gray">{job.checkListSet.name}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {renderStatusBadge(job.status)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-aws-font-color-gray">
                  {formatDate(job.createdAt)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onJobClick && onJobClick(job);
                    }}
                    className="text-aws-font-color-blue hover:text-aws-sea-blue-light flex items-center"
                    disabled={isDeleting}
                  >
                    <HiEye className="h-4 w-4 mr-1" />
                    詳細
                  </button>
                  <button
                    onClick={(e) => handleDelete(job.id, e)}
                    className="text-red hover:text-red flex items-center"
                    disabled={isDeleting}
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
  );
};

// ステータスに応じたバッジを表示する関数
const renderStatusBadge = (status: REVIEW_JOB_STATUS) => {
  switch (status) {
    case REVIEW_JOB_STATUS.COMPLETED:
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-aws-paper-light text-aws-lab">
          完了
        </span>
      );
    case REVIEW_JOB_STATUS.PROCESSING:
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-aws-paper-light text-aws-font-color-blue">
          処理中
        </span>
      );
    case REVIEW_JOB_STATUS.PENDING:
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-aws-paper-light text-yellow">
          待機中
        </span>
      );
    case REVIEW_JOB_STATUS.FAILED:
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

// 日付のフォーマット
const formatDate = (dateString: string | Date) => {
  if (!dateString) return '日付なし';
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) {
      return '無効な日付';
    }
    
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch (error) {
    console.error('Date formatting error:', error, dateString);
    return '日付エラー';
  }
};

export default ReviewJobList;
