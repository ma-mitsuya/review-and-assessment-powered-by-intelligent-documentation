/**
 * 審査結果フィルタリングコンポーネント
 */
import SegmentedControl from "../../../components/SegmentedControl";
import { HiCheck, HiX, HiViewList } from "react-icons/hi";
import { FilterType } from "../hooks/useReviewResultQueries";

interface ReviewResultFilterProps {
  filter: FilterType;
  onChange: (filter: FilterType) => void;
}

export default function ReviewResultFilter({
  filter,
  onChange,
}: ReviewResultFilterProps) {
  const filterLabels: Record<FilterType, string> = {
    all: "すべて",
    fail: "不合格",
    pass: "合格",
    processing: "処理中",
  };

  const options = [
    {
      value: "all" as FilterType,
      label: filterLabels["all"],
      icon: <HiViewList className="h-4 w-4 text-aws-font-color-gray" />,
    },
    {
      value: "fail" as FilterType,
      label: filterLabels["fail"],
      icon: <HiX className="h-4 w-4 text-red" />,
    },
    {
      value: "pass" as FilterType,
      label: filterLabels["pass"],
      icon: <HiCheck className="h-4 w-4 text-green-500" />,
    },
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
