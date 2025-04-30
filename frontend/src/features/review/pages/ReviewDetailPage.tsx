/**
 * 審査結果詳細ページ
 * 特定の審査ジョブの結果を階層構造で表示する
 */
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useReviewJobs } from '../hooks/useReviewJobs';
import ReviewResultTree from '../components/ReviewResultTree';
import ReviewResultFilter, { FilterType } from '../components/ReviewResultFilter';
import Button from '../../../components/Button';
import Spinner from '../../../components/Spinner';
import { ErrorAlert } from '../../../components/ErrorAlert';
import Slider from '../../../components/Slider';

export default function ReviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // フィルタリング状態 - デフォルトで不合格のみを表示
  const [filter, setFilter] = useState<FilterType>('failed');
  
  // 信頼度閾値
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.7);
  
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
      refreshJobs();
    }
  }, [id, refreshJobs]);
  
  // フィルタリング状態が変更されたときの処理
  const handleFilterChange = (newFilter: FilterType) => {
    console.log(`[Frontend] Filter changed from ${filter} to ${newFilter}`);
    setFilter(newFilter);
  };
  
  // 戻るボタンのハンドラー
  const handleBack = () => {
    navigate('/review');
  };
  
  // ローディング中の表示
  if (isLoadingJobs) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
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
        <ReviewResultFilter 
          filter={filter}
          onChange={handleFilterChange}
        />
        
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
