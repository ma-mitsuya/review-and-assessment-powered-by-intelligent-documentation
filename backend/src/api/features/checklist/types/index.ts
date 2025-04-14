/**
 * チェックリスト機能の型定義
 */

/**
 * チェックリストセットの処理状態
 */
export type ProcessingStatus = 'pending' | 'in_progress' | 'completed';

/**
 * チェックリスト項目のタイプ
 */
export type ChecklistItemType = 'simple' | 'flow';

/**
 * フロー条件のタイプ
 */
export type FlowConditionType = 'YES_NO' | 'MULTI_CHOICE';

/**
 * フローデータの型定義
 */
export interface FlowData {
  condition_type: FlowConditionType;
  next_if_yes?: string;
  next_if_no?: string;
  choices?: Array<{
    value: string;
    next_id: string;
  }>;
}

/**
 * ドキュメントの処理状態
 */
export type DocumentStatus = 'pending' | 'processing' | 'completed' | 'error';
