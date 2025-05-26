import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Button from "../../../components/Button";
import { ReviewJobList } from "../components/ReviewJobList";
import { useReviewJobs } from "../hooks/useReviewJobQueries";
import { HiPlus, HiDocumentText } from "react-icons/hi";
import { ErrorAlert } from "../../../components/ErrorAlert";

export const ReviewListPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
              審査ジョブ一覧
            </h1>
          </div>
          <p className="text-aws-font-color-gray mt-2">
            審査ジョブを管理します
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

      {error ? (
        <ErrorAlert
          title="読み込みエラー"
          message="審査ジョブの取得に失敗しました。"
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
