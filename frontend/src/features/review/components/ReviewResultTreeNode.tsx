/**
 * 審査結果の階層構造のノードコンポーネント
 * 子要素を動的に読み込む機能を持つ
 */
import { useState } from 'react';
import { ReviewResultDetailModel } from '../types';
import ReviewResultItem from './ReviewResultItem';
import { useReviewResultItems, FilterType } from '../hooks/useReviewResultQueries';
import Spinner from '../../../components/Spinner';

interface ReviewResultTreeNodeProps {
  jobId: string;
  item: ReviewResultDetailModel;
  level: number;
  confidenceThreshold: number;
  maxDepth?: number;
  autoExpand?: boolean;
  filter: FilterType;
}

export default function ReviewResultTreeNode({ 
  jobId, 
  item, 
  level, 
  confidenceThreshold,
  maxDepth = 2,
  autoExpand = false,
  filter
}: ReviewResultTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < maxDepth || autoExpand);
  
  console.log(`[Frontend] ReviewResultTreeNode - jobId: ${jobId}, checkId: ${item.checkId}, level: ${level}, hasChildren: ${item.hasChildren}, filter: ${filter}`);
  
  // 子項目を取得（レベルが最大深度未満の場合は自動的に、それ以外は展開時に）
  const shouldLoadChildren = item.hasChildren && (level < maxDepth || isExpanded);
  console.log(`[Frontend] shouldLoadChildren: ${shouldLoadChildren}, parentId: ${shouldLoadChildren ? item.checkId : 'undefined'}`);
  
  const { 
    items: childItems, 
    isLoading: isLoadingChildren,
    error: errorChildren
  } = useReviewResultItems(
    jobId || null,
    shouldLoadChildren ? item.checkId : undefined,
    filter
  );
  
  console.log(`[Frontend] Child items loaded: ${childItems.length}, isLoading: ${isLoadingChildren}, error: ${errorChildren ? 'yes' : 'no'}`);
  
  // 展開/折りたたみの切り替え
  const toggleExpand = () => {
    console.log(`[Frontend] Toggling expand for ${item.checkId} from ${isExpanded} to ${!isExpanded}`);
    setIsExpanded(!isExpanded);
  };
  
  // インデントのスタイル
  const indentStyle = {
    marginLeft: `${level * 20}px`,
  };
  
  return (
    <div>
      <div style={indentStyle}>
        <ReviewResultItem 
          result={{
            ...item,
            children: [] // ReviewResultItemコンポーネントの型との互換性のため
          }}
          hasChildren={item.hasChildren}
          isExpanded={isExpanded}
          onToggleExpand={toggleExpand}
          confidenceThreshold={confidenceThreshold}
          isLoadingChildren={shouldLoadChildren && isLoadingChildren}
        />
      </div>
      
      {/* 子項目を表示（展開時のみ） */}
      {isExpanded && item.hasChildren && (
        <div className="mt-2 space-y-2">
          {isLoadingChildren ? (
            <div className="flex justify-center py-4" style={{marginLeft: `${(level + 1) * 20}px`}}>
              <Spinner size="md" />
            </div>
          ) : errorChildren ? (
            <div className="text-red-500 py-2" style={{marginLeft: `${(level + 1) * 20}px`}}>
              子項目の読み込みに失敗しました。
            </div>
          ) : childItems.length > 0 ? (
            childItems.map(childItem => (
              <ReviewResultTreeNode 
                key={childItem.id} 
                jobId={jobId}
                item={childItem} 
                level={level + 1}
                confidenceThreshold={confidenceThreshold}
                maxDepth={maxDepth}
                filter={filter}
              />
            ))
          ) : (
            <div className="text-gray-500 py-2" style={{marginLeft: `${(level + 1) * 20}px`}}>
              {filter !== 'all' 
                ? `選択したフィルタ条件に一致する子項目がありません`
                : `子項目はありません`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
