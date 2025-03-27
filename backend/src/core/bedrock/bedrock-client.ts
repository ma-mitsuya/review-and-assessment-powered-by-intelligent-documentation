/**
 * LLM Client - AWS SDKとの通信を担当するモジュール
 */
import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";

/**
 * BedrockRuntimeClientを作成する
 * @param region AWS region
 * @returns BedrockRuntimeClient
 */
export function createBedrockRuntimeClient(): BedrockRuntimeClient {
  const region = process.env.BEDROCK_RUNTIME_REGION || "us-east-1";
  return new BedrockRuntimeClient({ region });
}
