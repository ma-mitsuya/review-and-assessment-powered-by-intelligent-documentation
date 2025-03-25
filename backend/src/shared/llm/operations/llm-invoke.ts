/**
 * LLM Invoke - AWS Bedrockへの単一リクエスト処理を行う関数群
 */
import { 
  BedrockRuntimeClient,
  ConverseCommand,
  ConversationRole,
  Message
} from "@aws-sdk/client-bedrock-runtime";

import {
  LlmMessage,
  LlmRequestOptions,
  LlmResponse,
  Result,
  err,
  ok
} from "../llm-types";

import { DEFAULT_OPTIONS } from "../llm-config";
import { handleError } from "../llm-core";
import { createBedrockClient } from "../llm-client";

/**
 * メッセージをConverseAPIの形式に変換する（単純化版）
 */
function formatSimpleMessages(messages: LlmMessage[]): Message[] {
  return messages.map(msg => {
    let role: ConversationRole;
    
    switch (msg.role) {
      case 'assistant':
        role = ConversationRole.ASSISTANT;
        break;
      case 'system':
      case 'user':
      default:
        role = ConversationRole.USER;
        break;
    }
    
    if (typeof msg.content === 'string') {
      return {
        role,
        content: [
          {
            text: msg.content
          }
        ]
      };
    } else {
      // マルチモーダルは現在サポートしていない
      return {
        role,
        content: [
          {
            text: Array.isArray(msg.content) ? 
              msg.content.filter(c => c.type === 'text').map(c => c.type === 'text' ? c.text : '').join('\n') : 
              'Content not supported'
          }
        ]
      };
    }
  });
}

/**
 * LLMにリクエストを送信し、レスポンスを取得する
 * @param messages 会話メッセージの配列
 * @param options リクエストオプション
 * @param client BedrockRuntimeClient（テスト用にオーバーライド可能）
 * @returns Result型でラップされたレスポンス
 */
export async function sendRequest(
  messages: LlmMessage[],
  options: Partial<LlmRequestOptions> = {},
  client: BedrockRuntimeClient = createBedrockClient()
): Promise<Result<LlmResponse>> {
  try {
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
    const { model, temperature, topP, maxTokens, stopSequences } = mergedOptions;
    
    const formattedMessages = formatSimpleMessages(messages);
    
    const command = new ConverseCommand({
      modelId: model,
      messages: formattedMessages,
      inferenceConfig: {
        maxTokens,
        temperature,
        topP,
        stopSequences
      }
    });

    const response = await client.send(command);
    
    // レスポンス処理
    const responseText = response.output?.message?.content?.[0]?.text || '';
    const usage = response.usage || { inputTokens: 0, outputTokens: 0, totalTokens: 0 };

    return ok({
      content: responseText,
      usage: {
        inputTokens: usage.inputTokens || 0,
        outputTokens: usage.outputTokens || 0,
        totalTokens: usage.totalTokens || 0
      }
    });
  } catch (error) {
    return err(handleError(error));
  }
}
