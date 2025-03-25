/**
 * LLM Service - AWS Bedrockとの対話を行う関数群
 */
import { 
  BedrockRuntimeClient,
  ConverseCommand,
  ConverseStreamCommand
} from "@aws-sdk/client-bedrock-runtime";

import {
  LlmMessage,
  LlmRequestOptions,
  LlmResponse,
  LlmStreamChunk,
  LlmStreamHandler,
  Result,
  err,
  ok
} from "./types";

import { DEFAULT_OPTIONS } from "./llm-config";
import { formatMessages, handleError } from "./llm-core";
import { createBedrockClient } from "./llm-client";

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
    
    const formattedMessages = formatMessages(messages);
    
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
    
    const formattedMessages = formatMessages(messages);
    
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
