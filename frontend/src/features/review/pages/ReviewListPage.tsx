import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "../../../components/Button";
import { ReviewJobList } from "../components/ReviewJobList";
import { useReviewJobs } from "../hooks/useReviewJobQueries";
import { HiPlus, HiDocumentText } from "react-icons/hi";
import { ErrorAlert } from "../../../components/ErrorAlert";

export const ReviewListPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  
  const {
    items: reviewJobs,
    refetch: revalidate,
    isLoading,
    error,
  } = useReviewJobs(1, 10, "createdAt", "desc");

  // 画面表示時またはlocationが変わった時にデータを再取得
  useEffect(() => {
    // 新規作成後に一覧画面に戻ってきた場合など、locationが変わった時にデータを再取得
    revalidate();
  }, [location, revalidate]);

  const handleJobClick = (job: any) => {
    console.log("Job selected:", job.id);
    navigate(`/review/${job.id}`);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center">
            <HiDocumentText className="h-8 w-8 mr-2 text-aws-font-color-light dark:text-aws-font-color-dark" />
            <h1 className="text-3xl font-bold text-aws-font-color-light dark:text-aws-font-color-dark">
              {t('review.title')}
            </h1>
          </div>
          <p className="text-aws-font-color-gray mt-2">
            {t('review.description')}
          </p>
        </div>
        <Button
          variant="primary"
          to="/review/create"
          icon={<HiPlus className="h-5 w-5" />}
        >
          {t('review.create')}
        </Button>
      </div>

      {error ? (
        <ErrorAlert
          title={t('review.loadError')}
          message={t('review.loadErrorMessage')}
          retry={revalidate}
        />
      ) : (
        <ReviewJobList
          jobs={reviewJobs}
          onJobClick={handleJobClick}
          revalidate={revalidate}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default ReviewListPage;
