/**
 * フローチャート関連の型定義
 * 
 * フローチャート型のチェックリスト項目で使用される型を定義します。
 * これらの型はチェックリスト項目の flowData フィールドで使用されます。
 */

/**
 * フローチャートの条件タイプ
 * - YES_NO: はい/いいえの二択
 * - MULTI_CHOICE: 複数の選択肢
 */
export type FlowConditionType = 'YES_NO' | 'MULTI_CHOICE';

/**
 * はい/いいえの二択フロー
 */
export interface YesNoFlowData {
  condition_type: 'YES_NO';
  next_if_yes: string; // チェックリスト項目のID
  next_if_no: string;  // チェックリスト項目のID
}

/**
 * 複数選択肢のフロー
 */
export interface MultiChoiceFlowData {
  condition_type: 'MULTI_CHOICE';
  next_options: Record<string, string>; // 選択肢: チェックリスト項目のID
}

/**
 * フローデータの共通型
 */
export type FlowData = YesNoFlowData | MultiChoiceFlowData;

/**
 * メタデータの型定義
 */
export interface MetaData {
  document_id?: string;
  page_number?: number;
  [key: string]: any; // その他のメタデータ
}
