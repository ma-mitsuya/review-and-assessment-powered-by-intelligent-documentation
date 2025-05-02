/**
 * 審査結果の階層構造を表示するツリーコンポーネント
 */
import { useReviewResultItems } from '../hooks/useReviewResultItems';
import ReviewResultTreeNode from './ReviewResultTreeNode';
import { TreeSkeleton } from '../../../components/Skeleton';
import { FilterType } from './ReviewResultFilter';

interface ReviewResultTreeProps {
  jobId: string;
  confidenceThreshold: number;
  maxDepth?: number;
  filter: FilterType;
}

export default function ReviewResultTree({ jobId, confidenceThreshold, maxDepth = 2, filter }: ReviewResultTreeProps) {
  // ルート項目を取得（フィルタリング条件を適用）
  const { 
    items: rootItems, 
    isLoading: isLoadingRoot,
    isError: isErrorRoot
  } = useReviewResultItems(jobId, undefined, filter);
  
  if (isLoadingRoot) {
    return <TreeSkeleton nodes={3} />;
  }
  
  if (isErrorRoot) {
    return (
      <div className="text-center py-10 text-red-500">
        審査結果の読み込みに失敗しました。
      </div>
    );
  }
  
  if (rootItems.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        {filter !== 'all' 
          ? `選択したフィルタ条件に一致する審査結果がありません`
          : `審査結果がありません`}
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {rootItems.map((item) => (
        <ReviewResultTreeNode 
          key={item.review_result_id} 
          jobId={jobId}
          item={item} 
          level={0} 
          confidenceThreshold={confidenceThreshold}
          maxDepth={maxDepth}
          filter={filter}
        />
      ))}
    </div>
  );
}
