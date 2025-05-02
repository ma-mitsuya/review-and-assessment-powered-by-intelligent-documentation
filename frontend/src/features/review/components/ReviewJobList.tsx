import React from 'react';
import { ReviewJob } from '../types';
import ReviewJobItem from './ReviewJobItem';
import { useReviewJobActions } from '../hooks/useReviewJobActions';
import { TableSkeleton } from '../../../components/Skeleton';
import { HiEye, HiTrash, HiInformationCircle } from 'react-icons/hi';

interface ReviewJobListProps {
  jobs: ReviewJob[];
  onJobClick?: (job: ReviewJob) => void;
  revalidate?: () => void;
  isLoading?: boolean;
}

export const ReviewJobList: React.FC<ReviewJobListProps> = ({ jobs, onJobClick, revalidate, isLoading }) => {
  const { deleteReviewJob } = useReviewJobActions();

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
              key={job.review_job_id} 
              className="hover:bg-aws-paper-light transition-colors"
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-aws-squid-ink-light">{job.name}</div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-aws-font-color-gray">{job.document.filename}</div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-aws-font-color-gray">{job.check_list_set.name}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {renderStatusBadge(job.status)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-aws-font-color-gray">
                  {formatDate(job.created_at)}
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
                  >
                    <HiEye className="h-4 w-4 mr-1" />
                    詳細
                  </button>
                  <button
                    onClick={(e) => handleDelete(job.review_job_id, e)}
                    className="text-red hover:text-red flex items-center"
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
const renderStatusBadge = (status: ReviewJob['status']) => {
  switch (status) {
    case 'completed':
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-aws-paper-light text-aws-lab">
          完了
        </span>
      );
    case 'processing':
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-aws-paper-light text-aws-font-color-blue">
          処理中
        </span>
      );
    case 'pending':
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-aws-paper-light text-yellow">
          待機中
        </span>
      );
    case 'failed':
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
const formatDate = (dateString: string) => {
  if (!dateString) return '日付なし';
  
  try {
    const date = new Date(dateString);
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
