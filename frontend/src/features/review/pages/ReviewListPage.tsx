import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/Button';
import ReviewJobList from '../components/ReviewJobList';
import useReviewJobs from '../hooks/useReviewJobs';

export const ReviewListPage: React.FC = () => {
  const navigate = useNavigate();
  const { jobs, loading, error, fetchJobs } = useReviewJobs();

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleCreateJob = () => {
    navigate('/review/create');
  };

  const handleJobClick = (job: any) => {
    // TBD: ジョブの詳細画面に遷移する実装
    console.log('Job clicked:', job);
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

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-fastPulse rounded-full h-12 w-12 border-t-2 border-b-2 border-aws-sea-blue-light"></div>
        </div>
      ) : error ? (
        <div className="bg-light-red border border-red text-red px-6 py-4 rounded-lg shadow-sm" role="alert">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <strong className="font-medium">エラー: </strong>
            <span className="ml-2">{error.message}</span>
          </div>
        </div>
      ) : (
        <ReviewJobList jobs={jobs} onJobClick={handleJobClick} />
      )}
    </div>
  );
};

export default ReviewListPage;
