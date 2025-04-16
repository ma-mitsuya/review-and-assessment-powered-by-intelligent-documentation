/**
 * 審査機能の定数
 */

/**
 * 審査ジョブのステータス
 */
export const REVIEW_JOB_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed'
} as const;

/**
 * 審査結果のステータス
 */
export const REVIEW_RESULT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed'
} as const;

/**
 * 審査結果の判定
 */
export const REVIEW_RESULT = {
  PASS: 'pass',
  FAIL: 'fail'
} as const;

/**
 * 信頼度スコアの閾値
 */
export const CONFIDENCE_THRESHOLD = 0.7;
