/**
 * 審査ジョブのステータス
 */
export const REVIEW_JOB_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

/**
 * 審査結果のステータス
 */
export const REVIEW_RESULT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

/**
 * 審査結果
 */
export const REVIEW_RESULT = {
  PASS: 'pass',
  FAIL: 'fail',
  UNKNOWN: 'unknown',
} as const;
