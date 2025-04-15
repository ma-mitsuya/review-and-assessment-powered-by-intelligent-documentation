import React from 'react';
import { ReviewJob } from '../types';
import ReviewJobItem from './ReviewJobItem';

interface ReviewJobListProps {
  jobs: ReviewJob[];
  onJobClick?: (job: ReviewJob) => void;
}

export const ReviewJobList: React.FC<ReviewJobListProps> = ({ jobs, onJobClick }) => {
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
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-light-gray">
          {jobs.map((job) => (
            <tr 
              key={job.id} 
              className="hover:bg-aws-paper-light transition-colors cursor-pointer"
              onClick={() => onJobClick && onJobClick(job)}
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-aws-squid-ink-light">{job.name}</div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-aws-font-color-gray">{job.documentName}</div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-aws-font-color-gray">{job.checklistName}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {renderStatusBadge(job.status)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-aws-font-color-gray">
                  {formatDate(job.createdAt)}
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
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export default ReviewJobList;
