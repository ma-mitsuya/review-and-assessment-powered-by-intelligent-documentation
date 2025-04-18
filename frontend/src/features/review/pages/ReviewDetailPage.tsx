/**
 * 審査結果詳細ページ
 * 特定の審査ジョブの結果を階層構造で表示する
 */
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useReviewResultHierarchy } from '../hooks/useReviewResultHierarchy';
import { useReviewJobs } from '../hooks/useReviewJobs';
import ReviewResultTree from '../components/ReviewResultTree';
import Button from '../../../components/Button';
import Spinner from '../../../components/Spinner';
import { ErrorAlert } from '../../../components/ErrorAlert';

export default function ReviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // 審査結果の階層構造を取得 - 明示的に文字列として渡す
  const { 
    hierarchy, 
    isLoading: isLoadingHierarchy, 
    isError: isErrorHierarchy, 
    mutate: refreshHierarchy 
  } = useReviewResultHierarchy(id ? String(id) : undefined);
  
  // 審査ジョブ情報を取得（ジョブ名などの表示用）
  const { 
    reviewJobs, 
    isLoading: isLoadingJobs, 
    mutate: refreshJobs 
  } = useReviewJobs();
  
  const currentJob = reviewJobs?.find(job => job.review_job_id === id);
  
  // コンポーネントマウント時に明示的にデータを取得
  useEffect(() => {
    if (id) {
      refreshHierarchy();
      refreshJobs();
    }
  }, [id, refreshHierarchy, refreshJobs]);
  
  // 戻るボタンのハンドラー
  const handleBack = () => {
    navigate('/review');
  };
  
  // ローディング中の表示
  if (isLoadingHierarchy || isLoadingJobs) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }
  
  // エラー時の表示
  if (isErrorHierarchy) {
    return (
      <div className="mt-4">
        <ErrorAlert 
          title="エラーが発生しました" 
          message="審査結果の取得に失敗しました。再度お試しください。"
          retry={() => {
            refreshHierarchy();
            refreshJobs();
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
  
  // 審査ジョブが見つからない場合
  if (!currentJob) {
    return (
      <div className="mt-4">
        <ErrorAlert 
          title="審査ジョブが見つかりません" 
          message="指定された審査ジョブは存在しないか、アクセス権限がありません。"
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
          <h1 className="text-2xl font-bold text-aws-squid-ink-light">{currentJob.name}</h1>
          <p className="text-aws-font-color-gray mt-1">
            ドキュメント: {currentJob.document.filename}
          </p>
          <p className="text-aws-font-color-gray">
            チェックリスト: {currentJob.check_list_set.name}
          </p>
        </div>
        <Button onClick={handleBack} variant="secondary">
          審査一覧に戻る
        </Button>
      </div>
      
      <div className="bg-white shadow-md rounded-lg p-6 border border-light-gray">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-medium text-aws-squid-ink-light">審査結果</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-2"></span>
              <span className="text-sm">合格: {currentJob.summary.passed}</span>
            </div>
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-2"></span>
              <span className="text-sm">不合格: {currentJob.summary.failed}</span>
            </div>
            {currentJob.summary.processing && (
              <div className="flex items-center">
                <span className="inline-block w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>
                <span className="text-sm">処理中: {currentJob.summary.processing}</span>
              </div>
            )}
          </div>
        </div>
        
        {hierarchy.length > 0 ? (
          <ReviewResultTree results={hierarchy} />
        ) : (
          <div className="text-center py-10">
            <p className="text-aws-font-color-gray">審査結果がありません</p>
          </div>
        )}
      </div>
    </div>
  );
}
