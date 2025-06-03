import React from 'react';
import { useTranslation } from 'react-i18next';
import { ReviewJobSummary, REVIEW_JOB_STATUS } from '../types';
import { useDeleteReviewJob } from '../hooks/useReviewJobMutations';
import { TableSkeleton } from '../../../components/Skeleton';
import { HiEye, HiTrash, HiInformationCircle } from 'react-icons/hi';
import Button from '../../../components/Button';

interface ReviewJobListProps {
  jobs: ReviewJobSummary[];
  onJobClick?: (job: ReviewJobSummary) => void;
  revalidate?: () => void;
  isLoading?: boolean;
}

export const ReviewJobList: React.FC<ReviewJobListProps> = ({ jobs, onJobClick, revalidate, isLoading }) => {
  const { t } = useTranslation();
  const { deleteReviewJob, status } = useDeleteReviewJob();
  const isDeleting = status === 'loading';

  const handleDelete = async (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (confirm(t('review.deleteConfirmation'))) {
      try {
        await deleteReviewJob(jobId);
        // 削除後にデータを再取得
        if (revalidate) {
          revalidate();
        }
      } catch (error) {
        alert(t('review.deleteError'));
        console.error(error);
      }
    }
  };

  // ステータスに応じたバッジを表示する関数
  const renderStatusBadge = (status: REVIEW_JOB_STATUS) => {
    switch (status) {
      case REVIEW_JOB_STATUS.COMPLETED:
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-aws-paper-light text-aws-lab">
            {t('status.completed')}
          </span>
        );
      case REVIEW_JOB_STATUS.PROCESSING:
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-aws-paper-light text-aws-font-color-blue">
            {t('status.processing')}
          </span>
        );
      case REVIEW_JOB_STATUS.PENDING:
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-aws-paper-light text-yellow">
            {t('status.pending')}
          </span>
        );
      case REVIEW_JOB_STATUS.FAILED:
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

  // 日付のフォーマット
  const formatDate = (dateString: string | Date) => {
    if (!dateString) return t('date.noDate');
    
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      if (isNaN(date.getTime())) {
        return t('date.invalidDate');
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
      return t('date.dateError');
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
          <span>{t('review.noJobs')}</span>
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
              {t('checklist.name')}
            </th>
            <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-aws-font-color-gray uppercase tracking-wider">
              {t('review.documents')}
            </th>
            <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-aws-font-color-gray uppercase tracking-wider">
              {t('review.checklist')}
            </th>
            <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-aws-font-color-gray uppercase tracking-wider">
              {t('review.status')}
            </th>
            <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-aws-font-color-gray uppercase tracking-wider">
              {t('review.createdAt')}
            </th>
            <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-aws-font-color-gray uppercase tracking-wider">
              {t('review.actions')}
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
                <div className="text-sm text-aws-font-color-gray">
                  {job.documents && job.documents.length > 0 
                    ? `${job.documents[0].filename}${job.documents.length > 1 ? ` (${t('review.otherDocuments', { count: job.documents.length - 1 })})` : ''}` 
                    : t('review.noDocuments')}
                </div>
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
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      onJobClick && onJobClick(job);
                    }}
                    variant="text"
                    size="sm"
                    icon={<HiEye className="h-4 w-4" />}
                    disabled={isDeleting}
                    className="text-aws-font-color-blue hover:text-aws-sea-blue-light"
                  >
                    {t('common.details')}
                  </Button>
                  <Button
                    onClick={(e) => handleDelete(job.id, e)}
                    variant="text"
                    size="sm"
                    icon={<HiTrash className="h-4 w-4" />}
                    disabled={isDeleting}
                    className="text-red hover:text-red"
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
  );
};

export default ReviewJobList;
