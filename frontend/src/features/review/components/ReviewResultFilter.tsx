/**
 * 審査結果フィルタリングコンポーネント
 */
import SegmentedControl from '../../../components/SegmentedControl';
import { HiCheck, HiX, HiViewList } from 'react-icons/hi';
import { FilterType } from '../hooks/useReviewResultQueries';

interface ReviewResultFilterProps {
  filter: FilterType;
  onChange: (filter: FilterType) => void;
}

export default function ReviewResultFilter({ 
  filter, 
  onChange 
}: ReviewResultFilterProps) {
  const options = [
    { 
      value: 'all', 
      label: 'すべて', 
      icon: <HiViewList className="h-4 w-4 text-aws-font-color-gray" />
    },
    { 
      value: 'failed', 
      label: '不合格', 
      icon: <HiX className="h-4 w-4 text-red" />
    },
    { 
      value: 'passed', 
      label: '合格', 
      icon: <HiCheck className="h-4 w-4 text-green-500" />
    }
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
