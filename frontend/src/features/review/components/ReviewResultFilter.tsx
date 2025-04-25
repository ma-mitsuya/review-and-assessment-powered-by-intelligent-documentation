/**
 * 審査結果フィルタリングコンポーネント
 */
import { useMemo } from 'react';
import SegmentedControl from '../../../components/SegmentedControl';
import { ReviewResultHierarchy } from '../types';
import { REVIEW_RESULT, REVIEW_RESULT_STATUS } from '../constants';

export type FilterType = 'all' | 'failed' | 'passed';

interface ReviewResultFilterProps {
  results: ReviewResultHierarchy[];
  filter: FilterType;
  onChange: (filter: FilterType) => void;
}

export default function ReviewResultFilter({ 
  results, 
  filter, 
  onChange 
}: ReviewResultFilterProps) {
  // 結果の数をカウント
  const counts = useMemo(() => {
    // フラット化して全ての結果を取得
    const flattenResults = (items: ReviewResultHierarchy[]): ReviewResultHierarchy[] => {
      return items.reduce<ReviewResultHierarchy[]>((acc, item) => {
        acc.push(item);
        if (item.children && item.children.length > 0) {
          acc.push(...flattenResults(item.children));
        }
        return acc;
      }, []);
    };

    const allResults = flattenResults(results);
    
    // 完了した結果のみをカウント
    const completedResults = allResults.filter(
      result => result.status === REVIEW_RESULT_STATUS.COMPLETED
    );
    
    const passedCount = completedResults.filter(
      result => result.result === REVIEW_RESULT.PASS
    ).length;
    
    const failedCount = completedResults.filter(
      result => result.result === REVIEW_RESULT.FAIL
    ).length;
    
    return {
      all: completedResults.length,
      passed: passedCount,
      failed: failedCount
    };
  }, [results]);

  const options = [
    { value: 'all', label: 'すべて', count: counts.all },
    { value: 'failed', label: '不合格', count: counts.failed },
    { value: 'passed', label: '合格', count: counts.passed }
  ];

  return (
    <SegmentedControl
      options={options}
      value={filter}
      onChange={(value) => onChange(value as FilterType)}
      name="result-filter"
      className="mb-4"
    />
  );
}
