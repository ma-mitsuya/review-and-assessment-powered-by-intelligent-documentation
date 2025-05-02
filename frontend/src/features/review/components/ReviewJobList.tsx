import React from 'react';
import { ReviewJob } from '../types';
import ReviewJobItem from './ReviewJobItem';
import { useReviewJobActions } from '../hooks/useReviewJobActions';
import { TableSkeleton } from '../../../components/Skeleton';

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
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
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
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path
                        fillRule="evenodd"
                        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    詳細
                  </button>
                  <button
                    onClick={(e) => handleDelete(job.review_job_id, e)}
                    className="text-red hover:text-red flex items-center"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
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
        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
          完了
        </span>
      );
    case 'processing':
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
          処理中
        </span>
      );
    case 'pending':
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
          待機中
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
