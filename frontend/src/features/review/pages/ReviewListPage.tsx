import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Button from '../../../components/Button';
import { ReviewJobList } from '../components/ReviewJobList';
import { useReviewJobs } from '../hooks/useReviewJobs';
import { HiPlus, HiDocumentText } from 'react-icons/hi';

export const ReviewListPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { reviewJobs, revalidate, isLoading } = useReviewJobs(1, 10, 'createdAt', 'desc');

  // 画面表示時またはlocationが変わった時にデータを再取得
  useEffect(() => {
    // 新規作成後に一覧画面に戻ってきた場合など、locationが変わった時にデータを再取得
    revalidate();
  }, [location, revalidate]);

  const handleJobClick = (job: any) => {
    // TBD: ジョブの詳細画面に遷移する実装
    console.log('Job selected:', job.id || job.reviewJobId);
    navigate(`/review/${job.id || job.reviewJobId}`);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center">
            <HiDocumentText className="h-8 w-8 mr-2 text-aws-font-color-light dark:text-aws-font-color-dark" />
            <h1 className="text-3xl font-bold text-aws-font-color-light dark:text-aws-font-color-dark">審査ジョブ一覧</h1>
          </div>
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

      <ReviewJobList jobs={reviewJobs} onJobClick={handleJobClick} revalidate={revalidate} isLoading={isLoading} />
    </div>
  );
};

export default ReviewListPage;
