/**
 * LLM Core - 純粋関数を集めたモジュール
 */
import { 
  ConversationRole,
  ValidationException,
  ServiceUnavailableException,
  ThrottlingException,
  ServiceQuotaExceededException
} from "@aws-sdk/client-bedrock-runtime";

import {
  LlmMessage,
  LlmServiceError
} from "./types";

/**
 * メッセージの役割をAWS SDKのConversationRoleに変換する
 */
export function mapRole(role: 'user' | 'assistant' | 'system'): ConversationRole {
  switch (role) {
    case 'user':
      return ConversationRole.USER;
    case 'assistant':
      return ConversationRole.ASSISTANT;
    // System role is not supported in Converse API, we'll use USER instead
    case 'system':
      return ConversationRole.USER;
  }
}

/**
 * メッセージをConverseAPIの形式に変換する
 */
export function formatMessages(messages: LlmMessage[]) {
  return messages.map(msg => ({
    role: mapRole(msg.role),
    content: [{ text: msg.content }]
  }));
}

/**
 * BedrockのエラーをLlmServiceErrorに変換する
 */
export function handleError(error: unknown): LlmServiceError {
  if (error instanceof ValidationException) {
    return { type: 'INVALID_INPUT', message: error.message };
  } else if (error instanceof ServiceUnavailableException) {
    return { type: 'SERVICE_UNAVAILABLE', message: error.message };
  } else if (
    error instanceof ThrottlingException ||
    error instanceof ServiceQuotaExceededException
  ) {
    return { type: 'RATE_LIMIT_EXCEEDED', message: error.message };
  } else {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { 
      type: 'UNKNOWN_ERROR', 
      message: errorMessage,
      originalError: error
    };
  }
}
