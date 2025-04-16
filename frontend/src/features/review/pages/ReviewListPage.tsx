import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/Button';
import { ReviewJobList } from '../components/ReviewJobList';
import { useReviewJobs } from '../hooks/useReviewJobs';

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
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          }
        >
          新規ジョブ作成
        </Button>
      </div>

      <ReviewJobList jobs={reviewJobs} onJobClick={handleJobClick} />
    </div>
  );
};

export default ReviewListPage;
