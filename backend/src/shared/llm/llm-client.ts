/**
 * LLM Client - AWS SDKとの通信を担当するモジュール
 */
import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";

/**
 * BedrockRuntimeClientを作成する
 * @param region AWS region
 * @returns BedrockRuntimeClient
 */
export function createBedrockClient(region: string = 'us-west-2'): BedrockRuntimeClient {
  return new BedrockRuntimeClient({ region });
}
