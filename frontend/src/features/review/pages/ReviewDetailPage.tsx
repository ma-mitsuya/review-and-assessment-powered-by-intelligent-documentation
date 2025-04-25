/**
 * 審査結果詳細ページ
 * 特定の審査ジョブの結果を階層構造で表示する
 */
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import { useReviewResultHierarchy } from '../hooks/useReviewResultHierarchy';
import { useReviewJobs } from '../hooks/useReviewJobs';
import ReviewResultTree from '../components/ReviewResultTree';
import ReviewResultFilter, { FilterType } from '../components/ReviewResultFilter';
import Button from '../../../components/Button';
import Spinner from '../../../components/Spinner';
import { ErrorAlert } from '../../../components/ErrorAlert';
import { REVIEW_RESULT, REVIEW_RESULT_STATUS } from '../constants';
import { ReviewResultHierarchy } from '../types';
import Slider from '../../../components/Slider';

export default function ReviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // フィルタリング状態 - デフォルトで不合格のみを表示
  const [filter, setFilter] = useState<FilterType>('failed');
  
  // 信頼度閾値
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.7);
  
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
  
  // フィルタリングされた結果を計算
  const filteredHierarchy = useMemo(() => {
    if (!hierarchy) return [];
    
    // 再帰的にフィルタリングを適用
    const filterResults = (items: ReviewResultHierarchy[]): ReviewResultHierarchy[] => {
      return items
        .map(item => {
          // 子要素を先にフィルタリング
          const filteredChildren = item.children && item.children.length > 0
            ? filterResults(item.children)
            : [];
          
          // 現在の項目がフィルタ条件に一致するか、または子要素が存在する場合
          const matchesFilter = 
            filter === 'all' ||
            (filter === 'failed' && 
              item.status === REVIEW_RESULT_STATUS.COMPLETED && 
              item.result === REVIEW_RESULT.FAIL) ||
            (filter === 'passed' && 
              item.status === REVIEW_RESULT_STATUS.COMPLETED && 
              item.result === REVIEW_RESULT.PASS);
          
          // フィルタ条件に一致するか、フィルタリングされた子要素がある場合は表示
          if (matchesFilter || filteredChildren.length > 0) {
            return {
              ...item,
              children: filteredChildren
            };
          }
          
          // それ以外の場合は null を返して後でフィルタリング
          return null;
        })
        .filter((item): item is ReviewResultHierarchy => item !== null);
    };
    
    return filterResults(hierarchy);
  }, [hierarchy, filter]);
  
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
        {hierarchy && hierarchy.length > 0 && (
          <ReviewResultFilter 
            results={hierarchy}
            filter={filter}
            onChange={setFilter}
          />
        )}
        
        {filteredHierarchy.length > 0 ? (
          <ReviewResultTree 
            results={filteredHierarchy} 
            confidenceThreshold={confidenceThreshold}
          />
        ) : (
          <div className="text-center py-10">
            <p className="text-aws-font-color-gray">
              {hierarchy && hierarchy.length > 0 
                ? `選択したフィルタ条件に一致する審査結果がありません`
                : `審査結果がありません`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
