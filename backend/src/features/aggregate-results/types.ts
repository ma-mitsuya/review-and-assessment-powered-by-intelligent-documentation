import { ChecklistResponse } from "../result-combining/types";

/**
 * 集約結果のインターフェース
 */
export interface AggregateResult {
  documentId: string;
  aggregatedData: Record<string, ChecklistResponse[]>;
}

/**
 * 集約処理のパラメータ
 */
export interface AggregateParams {
  documentId: string;
  pageCount: number;
}
