/**
 * Types for the LLM service
 */

// Branded types for type safety
export type Branded<T, B> = T & { readonly _brand: B };

// Error types
export type LlmServiceError =
  | { type: 'INVALID_INPUT'; message: string }
  | { type: 'SERVICE_UNAVAILABLE'; message: string }
  | { type: 'RATE_LIMIT_EXCEEDED'; message: string }
  | { type: 'UNKNOWN_ERROR'; message: string; originalError?: unknown };

// Result type for error handling
export type Result<T, E = LlmServiceError> = 
  | { ok: true; value: T } 
  | { ok: false; error: E };

// Helper functions for Result type
export const ok = <T>(value: T): { ok: true; value: T } => ({ ok: true, value });
export const err = <E>(error: E): { ok: false; error: E } => ({ ok: false, error });

// LLM model types
export type SupportedModel = 
  | 'anthropic.claude-3-sonnet-20240229-v1:0'
  | 'anthropic.claude-3-haiku-20240307-v1:0'
  | 'anthropic.claude-instant-v1';

// LLM request types
export interface LlmRequestOptions {
  model: SupportedModel;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  stopSequences?: string[];
}

export interface LlmMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// LLM response types
export interface LlmResponse {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

// Streaming response types
export interface LlmStreamChunk {
  content: string;
  isDone: boolean;
}

export type LlmStreamHandler = (chunk: LlmStreamChunk) => void;
