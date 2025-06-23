import { useMemo } from "react";
import type { ReviewResultDetail } from "../types";

interface TotalReviewCostResult {
  hasCost: boolean;
  totalCost: number;
  formattedTotalCost: string;
  summary: {
    totalInputTokens: number;
    totalOutputTokens: number;
    itemCount: number;
  };
}

/**
 * 審査結果全体の合計料金情報を扱うフック
 *
 * @param items 審査結果アイテムの配列
 * @returns 合計料金情報の計算結果
 */
export function useTotalReviewCost(
  items: ReviewResultDetail[]
): TotalReviewCostResult {
  return useMemo(() => {
    // items が undefined や null の場合や空配列の場合にデフォルト値を返す
    if (!items || items.length === 0) {
      return {
        hasCost: false,
        totalCost: 0,
        formattedTotalCost: "",
        summary: {
          totalInputTokens: 0,
          totalOutputTokens: 0,
          itemCount: 0,
        },
      };
    }

    let totalCost = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let itemsWithCost = 0;

    items.forEach((item) => {
      const cost = item.totalCost || item.reviewMeta?.total_cost || 0;
      const inputTokens =
        item.inputTokens || item.reviewMeta?.input_tokens || 0;
      const outputTokens =
        item.outputTokens || item.reviewMeta?.output_tokens || 0;

      if (cost > 0) {
        totalCost += cost;
        totalInputTokens += inputTokens;
        totalOutputTokens += outputTokens;
        itemsWithCost++;
      }
    });

    const hasCost = totalCost > 0;
    const formattedTotalCost = hasCost ? `$${totalCost.toFixed(4)}` : "";

    return {
      hasCost,
      totalCost,
      formattedTotalCost,
      summary: {
        totalInputTokens,
        totalOutputTokens,
        itemCount: itemsWithCost,
      },
    };
  }, [items]);
}
