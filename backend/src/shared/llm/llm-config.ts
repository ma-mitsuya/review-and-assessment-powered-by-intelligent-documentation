/**
 * LLM Config - 設定関連
 */
import { LlmRequestOptions } from "./llm-types";

/**
 * LLMリクエストのデフォルトオプション
 */
export const DEFAULT_OPTIONS: Partial<LlmRequestOptions> = {
  model: 'anthropic.claude-3-sonnet-20240229-v1:0',
  temperature: 0.2,
  topP: 0.9,
  maxTokens: 4096
};
