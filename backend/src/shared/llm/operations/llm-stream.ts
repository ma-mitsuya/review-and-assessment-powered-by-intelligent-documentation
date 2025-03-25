/**
 * LLM Stream - AWS Bedrockへのストリーミングリクエスト処理を行う関数群
 */
import { 
  BedrockRuntimeClient,
  ConverseStreamCommand,
  ConversationRole,
  Message
} from "@aws-sdk/client-bedrock-runtime";

import {
  LlmMessage,
  LlmRequestOptions,
  LlmStreamChunk,
  LlmStreamHandler,
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
 * LLMにストリーミングリクエストを送信し、チャンク単位でレスポンスを処理する
 * @param messages 会話メッセージの配列
 * @param handler ストリーミングチャンクを処理するハンドラー関数
 * @param options リクエストオプション
 * @param client BedrockRuntimeClient（テスト用にオーバーライド可能）
 * @returns Result型でラップされた処理結果
 */
export async function sendStreamingRequest(
  messages: LlmMessage[],
  handler: LlmStreamHandler,
  options: Partial<LlmRequestOptions> = {},
  client: BedrockRuntimeClient = createBedrockClient()
): Promise<Result<void>> {
  try {
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
    const { model, temperature, topP, maxTokens, stopSequences } = mergedOptions;
    
    const formattedMessages = formatSimpleMessages(messages);
    
    const command = new ConverseStreamCommand({
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
    const stream = response.stream;

    if (!stream) {
      return err({ type: 'UNKNOWN_ERROR', message: 'No stream returned from Bedrock' });
    }

    for await (const chunk of stream) {
      if (chunk.contentBlockDelta) {
        handler({
          content: chunk.contentBlockDelta.delta?.text || '',
          isDone: false
        });
      } else if (chunk.messageStop) {
        handler({
          content: '',
          isDone: true
        });
      }
    }

    return ok(undefined);
  } catch (error) {
    return err(handleError(error));
  }
}
