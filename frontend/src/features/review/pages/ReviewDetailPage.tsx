import { useParams, useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import ReviewResultTree from "../components/ReviewResultTree";
import ReviewResultFilter from "../components/ReviewResultFilter";
import { FilterType } from "../hooks/useReviewResultQueries";
import { useReviewJobDetail } from "../hooks/useReviewJobQueries";
import Button from "../../../components/Button";
import { ErrorAlert } from "../../../components/ErrorAlert";
import Slider from "../../../components/Slider";
import { DetailSkeleton } from "../../../components/Skeleton";
import { REVIEW_JOB_STATUS } from "../types";
import Breadcrumb from "../../../components/Breadcrumb";

export default function ReviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // 全件表示でスタート
  const [filter, setFilter] = useState<FilterType>("all");
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.7);

  // 審査ジョブ詳細を取得
  const {
    job,
    isLoading: isLoadingJob,
    error: jobError,
    refetch: refetchJob,
  } = useReviewJobDetail(id || null);

  // フィルタリング状態が変更されたとき
  const handleFilterChange = (newFilter: FilterType) => {
    console.log(`[Frontend] Filter changed from ${filter} to ${newFilter}`);
    setFilter(newFilter);
  };

  // 戻るボタン
  const handleBack = () => {
    navigate("/review");
  };

  // ローディング中
  if (isLoadingJob) {
    return <DetailSkeleton lines={8} />;
  }

  // エラー発生時
  if (jobError) {
    return (
      <div className="mt-4">
        <ErrorAlert
          title="読み込みエラー"
          message="審査ジョブの取得に失敗しました。"
          retry={() => {
            refetchJob();
          }}
        />
        <div className="mt-4">
          <Breadcrumb to="/review" label="審査一覧に戻る" />
        </div>
      </div>
    );
  }

  // ジョブが取得できなかった場合
  if (!job) {
    return (
      <div className="mt-4">
        <ErrorAlert
          title="データエラー"
          message="審査ジョブが見つかりませんでした。"
          retry={() => refetchJob()}
        />
        <div className="mt-4">
          <Breadcrumb to="/review" label="審査一覧に戻る" />
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* ヘッダー */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <Breadcrumb to="/review" label="審査一覧に戻る" />
          <h1 className="text-2xl font-bold text-aws-squid-ink-light">
            {job.name}
          </h1>
          <p className="text-aws-font-color-gray mt-1">
            ドキュメント: {job.document.filename}
          </p>
          <p className="text-aws-font-color-gray">
            チェックリスト: {job.checkList.name}
          </p>
          <p className="text-aws-font-color-gray">
            ステータス:&nbsp;
            <span
              className={`font-medium ${
                job.status === REVIEW_JOB_STATUS.COMPLETED
                  ? "text-green-600"
                  : job.status === REVIEW_JOB_STATUS.FAILED
                  ? "text-red-600"
                  : "text-yellow-600"
              }`}
            >
              {job.status === REVIEW_JOB_STATUS.PENDING
                ? "待機中"
                : job.status === REVIEW_JOB_STATUS.PROCESSING
                ? "処理中"
                : job.status === REVIEW_JOB_STATUS.COMPLETED
                ? "完了"
                : "失敗"}
            </span>
          </p>
          <p className="text-aws-font-color-gray">
            作成日時: {new Date(job.createdAt).toLocaleString()}
          </p>
          {job.completedAt && (
            <p className="text-aws-font-color-gray">
              完了日時: {new Date(job.completedAt).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {/* 審査結果 */}
      <div className="bg-white shadow-md rounded-lg p-6 border border-light-gray">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-medium text-aws-squid-ink-light">
            審査結果
          </h2>
          <div className="w-64">
            <Slider
              min={0}
              max={1}
              step={0.05}
              value={confidenceThreshold}
              onChange={setConfidenceThreshold}
              label="信頼度閾値"
            />
          </div>
        </div>

        {/* フィルタリング */}
        <ReviewResultFilter filter={filter} onChange={handleFilterChange} />

        {/* ツリー表示 */}
        <ReviewResultTree
          jobId={id!}
          confidenceThreshold={confidenceThreshold}
          maxDepth={2}
          filter={filter}
        />
      </div>
    </div>
  );
}
