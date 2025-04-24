import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/Button';
import { ReviewJobList } from '../components/ReviewJobList';
import { useReviewJobs } from '../hooks/useReviewJobs';
import { HiPlus } from 'react-icons/hi';

export const ReviewListPage: React.FC = () => {
  const navigate = useNavigate();
  const { reviewJobs } = useReviewJobs(1, 10, 'createdAt', 'desc');

  const handleJobClick = (job: any) => {
    // TBD: ジョブの詳細画面に遷移する実装
    console.log('Job selected:', job.id || job.review_job_id);
    navigate(`/review/${job.id || job.review_job_id}`);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-aws-font-color-light dark:text-aws-font-color-dark">審査ジョブ一覧</h1>
          <p className="text-aws-font-color-gray mt-2">
            不動産書類の審査ジョブを管理します
          </p>
        </div>
        <Button 
          variant="primary" 
          to="/review/create"
          icon={<HiPlus className="h-5 w-5" />}
        >
          新規ジョブ作成
        </Button>
      </div>

      <ReviewJobList jobs={reviewJobs} onJobClick={handleJobClick} />
    </div>
  );
};

export default ReviewListPage;
