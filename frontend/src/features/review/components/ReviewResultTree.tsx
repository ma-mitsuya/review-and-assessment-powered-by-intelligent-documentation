/**
 * 審査結果の階層構造を表示するツリーコンポーネント
 */
import { useState } from 'react';
import { ReviewResultHierarchy } from '../types';
import ReviewResultItem from './ReviewResultItem';

interface ReviewResultTreeProps {
  results: ReviewResultHierarchy[];
  confidenceThreshold: number;
}

export default function ReviewResultTree({ results, confidenceThreshold }: ReviewResultTreeProps) {
  return (
    <div className="space-y-4">
      {results.map((result) => (
        <ReviewResultTreeNode 
          key={result.review_result_id} 
          result={result} 
          level={0} 
          confidenceThreshold={confidenceThreshold}
        />
      ))}
    </div>
  );
}

interface ReviewResultTreeNodeProps {
  result: ReviewResultHierarchy;
  level: number;
  confidenceThreshold: number;
}

function ReviewResultTreeNode({ result, level, confidenceThreshold }: ReviewResultTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = result.children && result.children.length > 0;
  
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  // インデントのスタイル - チェックリストコンポーネントと同様
  const indentStyle = {
    marginLeft: `${level * 20}px`,
  };
  
  return (
    <div>
      <div style={indentStyle}>
        <ReviewResultItem 
          result={result} 
          hasChildren={hasChildren}
          isExpanded={isExpanded}
          onToggleExpand={toggleExpand}
          confidenceThreshold={confidenceThreshold}
        />
      </div>
      
      {/* 子項目を表示（展開時のみ） */}
      {hasChildren && isExpanded && (
        <div className="mt-2 space-y-2">
          {result.children.map(child => (
            <ReviewResultTreeNode 
              key={child.review_result_id} 
              result={child} 
              level={level + 1}
              confidenceThreshold={confidenceThreshold}
            />
          ))}
        </div>
      )}
    </div>
  );
}
