/**
 * LLM Batch - AWS Bedrockのバッチ処理を行う関数群
 */
import { 
  BedrockRuntimeClient,
  InvokeModelCommand
} from "@aws-sdk/client-bedrock-runtime";

import {
  LlmMessage,
  LlmRequestOptions,
  LlmBatchResponse,
  LlmBatchSuccessResponse,
  LlmBatchErrorResponse,
  LlmBatchRequest,
  Result,
  err,
  ok
} from "../llm-types";

import { DEFAULT_OPTIONS } from "../llm-config";
import { handleError } from "../llm-core";
import { createBedrockClient } from "../llm-client";

/**
 * メッセージをInvokeModelの形式に変換する
 */
function formatInvokeMessages(messages: LlmMessage[]) {
  return messages.map(msg => {
    if (typeof msg.content === 'string') {
      return {
        role: msg.role,
        content: msg.content
      };
    } else {
      // マルチモーダルコンテンツの場合
      return {
        role: msg.role,
        content: msg.content
      };
    }
  });
}

/**
 * 複数のLLMリクエストをバッチ処理する
 * @param batchRequests バッチリクエストの配列
 * @param options リクエストオプション
 * @param client BedrockRuntimeClient（テスト用にオーバーライド可能）
 * @returns Result型でラップされたバッチレスポンス
 */
export async function sendBatchRequest(
  batchRequests: LlmBatchRequest[],
  options: Partial<LlmRequestOptions> = {},
  client: BedrockRuntimeClient = createBedrockClient()
): Promise<Result<LlmBatchResponse[]>> {
  try {
    if (!batchRequests || batchRequests.length === 0) {
      return err({ 
        type: 'INVALID_INPUT', 
        message: 'Batch requests cannot be empty' 
      });
    }

    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
    const { model, temperature, topP, maxTokens, stopSequences } = mergedOptions;
    
    // 並列処理でリクエストを送信
    const results = await Promise.all(
      batchRequests.map(async request => {
        try {
          const formattedMessages = formatInvokeMessages(request.messages);
          
          const command = new InvokeModelCommand({
            modelId: model,
            body: JSON.stringify({
              anthropic_version: "bedrock-2023-05-31",
              messages: formattedMessages,
              max_tokens: maxTokens,
              temperature,
              top_p: topP,
              stop_sequences: stopSequences
            })
          });
          
          const response = await client.send(command);
          const responseBody = JSON.parse(new TextDecoder().decode(response.body));
          
          // Claude-3モデルのレスポンス形式に対応
          let content = '';
          
          if (responseBody.content && Array.isArray(responseBody.content)) {
            content = responseBody.content[0]?.text || '';
          } else if (responseBody.completion) {
            // Claude-2モデル用
            content = responseBody.completion;
          }
          
          const usage = {
            inputTokens: responseBody.usage?.input_tokens || 0,
            outputTokens: responseBody.usage?.output_tokens || 0,
            totalTokens: responseBody.usage?.total_tokens || 0
          };
          
          const successResponse: LlmBatchSuccessResponse = {
            id: request.id,
            success: true,
            content,
            usage
          };
          
          return successResponse;
        } catch (error) {
          const errorResponse: LlmBatchErrorResponse = {
            id: request.id,
            success: false,
            error: handleError(error)
          };
          
          return errorResponse;
        }
      })
    );
    
    return ok(results);
  } catch (error) {
    return err(handleError(error));
  }
}

/**
 * 複数のページをバッチ処理する
 * @param pages 処理するページの配列（各ページはIDとメッセージを含む）
 * @param options リクエストオプション
 * @param client BedrockRuntimeClient（テスト用にオーバーライド可能）
 * @returns Result型でラップされたバッチレスポンス
 */
export async function processPagesInBatch(
  pages: { id: string, messages: LlmMessage[] }[],
  options: Partial<LlmRequestOptions> = {},
  client: BedrockRuntimeClient = createBedrockClient()
): Promise<Result<LlmBatchResponse[]>> {
  // バッチリクエストに変換
  const batchRequests: LlmBatchRequest[] = pages.map(page => ({
    id: page.id,
    messages: page.messages
  }));
  
  return await sendBatchRequest(batchRequests, options, client);
}
