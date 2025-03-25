/**
 * LLM Service - 型定義
 */

/**
 * LLMメッセージの役割
 */
export type LlmRole = 'system' | 'user' | 'assistant';

/**
 * LLMメッセージのコンテンツタイプ
 */
export type LlmContentType = 'text' | 'image';

/**
 * LLMメッセージのテキストコンテンツ
 */
export interface LlmTextContent {
  type: 'text';
  text: string;
}

/**
 * LLMメッセージの画像コンテンツ
 */
export interface LlmImageContent {
  type: 'image';
  source: {
    type: 'base64';
    media_type: string;
    data: string;
  };
}

/**
 * LLMメッセージのコンテンツ
 */
export type LlmContent = string | (LlmTextContent | LlmImageContent)[];

/**
 * LLMメッセージ
 */
export interface LlmMessage {
  role: LlmRole;
  content: LlmContent;
}

/**
 * LLMリクエストオプション
 */
export interface LlmRequestOptions {
  model: string;
  temperature: number;
  topP: number;
  maxTokens: number;
  stopSequences: string[];
}

/**
 * LLMレスポンス
 */
export interface LlmResponse {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

/**
 * LLMバッチリクエスト
 */
export interface LlmBatchRequest {
  id: string;
  messages: LlmMessage[];
}

/**
 * LLMバッチレスポンス（成功）
 */
export interface LlmBatchSuccessResponse {
  id: string;
  success: true;
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

/**
 * LLMバッチレスポンス（失敗）
 */
export interface LlmBatchErrorResponse {
  id: string;
  success: false;
  error: LlmServiceError;
}

/**
 * LLMバッチレスポンス
 */
export type LlmBatchResponse = LlmBatchSuccessResponse | LlmBatchErrorResponse;

/**
 * LLMストリーミングチャンク
 */
export interface LlmStreamChunk {
  content: string;
  isDone: boolean;
}

/**
 * LLMストリーミングハンドラー
 */
export type LlmStreamHandler = (chunk: LlmStreamChunk) => void;

/**
 * LLMサービスエラータイプ
 */
export type LlmServiceErrorType =
  | 'INVALID_INPUT'
  | 'NETWORK_ERROR'
  | 'RATE_LIMIT'
  | 'TIMEOUT'
  | 'UNKNOWN_ERROR';

/**
 * LLMサービスエラー
 */
export interface LlmServiceError {
  type: LlmServiceErrorType;
  message: string;
  originalError?: unknown;
}

/**
 * 成功結果
 */
export interface Ok<T> {
  ok: true;
  value: T;
}

/**
 * 失敗結果
 */
export interface Err<E> {
  ok: false;
  error: E;
}

/**
 * 結果型
 */
export type Result<T, E = LlmServiceError> = Ok<T> | Err<E>;

/**
 * 成功結果を作成
 */
export function ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}

/**
 * 失敗結果を作成
 */
export function err<E>(error: E): Err<E> {
  return { ok: false, error };
}
