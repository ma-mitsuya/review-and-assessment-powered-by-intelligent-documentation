/**
 * 審査結果詳細ページ
 * 特定の審査ジョブの結果を階層構造で表示する
 */
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import ReviewResultTree from "../components/ReviewResultTree";
import ReviewResultFilter from "../components/ReviewResultFilter";
import {
  FilterType,
  useReviewResultItems,
} from "../hooks/useReviewResultQueries";
import { useReviewJobDetail } from "../hooks/useReviewJobQueries";
import Button from "../../../components/Button";
import { ErrorAlert } from "../../../components/ErrorAlert";
import Slider from "../../../components/Slider";
import { DetailSkeleton } from "../../../components/Skeleton";
import { REVIEW_JOB_STATUS } from "../types";

export default function ReviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [filter, setFilter] = useState<FilterType>("fail");
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.7);

  // 審査ジョブ詳細を取得
  const {
    job,
    isLoading: isLoadingJob,
    error: jobError,
    refetch: refetchJob,
  } = useReviewJobDetail(id || null);

  const {
    items: currentJob,
    isLoading: isLoadingJobs,
    refetch: revalidate,
    error,
  } = useReviewResultItems(id || null);

  useEffect(() => {
    if (id) {
      revalidate();
      refetchJob();
    }
  }, [id, revalidate, refetchJob]);

  // フィルタリング状態が変更されたときの処理
  const handleFilterChange = (newFilter: FilterType) => {
    console.log(`[Frontend] Filter changed from ${filter} to ${newFilter}`);
    setFilter(newFilter);
  };

  // 戻るボタンのハンドラー
  const handleBack = () => {
    navigate("/review");
  };

  // ローディング中の表示
  if (isLoadingJobs || isLoadingJob) {
    return <DetailSkeleton lines={8} />;
  }

  // エラーが発生した場合
  if (error || jobError) {
    return (
      <div className="mt-4">
        <ErrorAlert
          title="読み込みエラー"
          message="審査ジョブの取得に失敗しました。"
          retry={() => {
            revalidate();
            refetchJob();
          }}
        />
        <div className="mt-4">
          <Button onClick={handleBack} variant="secondary">
            審査一覧に戻る
          </Button>
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
          <Button onClick={handleBack} variant="secondary">
            審査一覧に戻る
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
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
            ステータス: <span className={`font-medium ${job.status === REVIEW_JOB_STATUS.COMPLETED ? 'text-green-600' : job.status === REVIEW_JOB_STATUS.FAILED ? 'text-red-600' : 'text-yellow-600'}`}>
              {job.status === REVIEW_JOB_STATUS.PENDING ? '待機中' : 
               job.status === REVIEW_JOB_STATUS.PROCESSING ? '処理中' : 
               job.status === REVIEW_JOB_STATUS.COMPLETED ? '完了' : '失敗'}
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
        <Button onClick={handleBack} variant="secondary">
          審査一覧に戻る
        </Button>
      </div>

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

        {/* フィルタリングコントロールを追加 */}
        <ReviewResultFilter filter={filter} onChange={handleFilterChange} />

        {/* 審査結果ツリーを表示（フィルタリング条件を渡す） */}
        <ReviewResultTree
          jobId={id!}
          confidenceThreshold={confidenceThreshold}
          maxDepth={2} // 最初に表示する深さを指定
          filter={filter}
        />
      </div>
    </div>
  );
}
