interface ReviewItemCostBadgeProps {
  formattedCost: string;
  size?: "sm" | "md";
}

/**
 * 審査項目の料金を表示するバッジコンポーネント
 */
export default function ReviewItemCostBadge({
  formattedCost,
  size = "sm",
}: ReviewItemCostBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border border-sky-300 font-medium text-sky-600 ${sizeClasses[size]}`}>
      {formattedCost}
    </span>
  );
}
