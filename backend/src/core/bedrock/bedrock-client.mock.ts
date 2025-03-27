// llm-client.mock.ts
import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import { vi } from "vitest";

export function createMockBedrockRuntimeClient(): BedrockRuntimeClient & {
  send: ReturnType<typeof vi.fn>;
} {
  const client = new BedrockRuntimeClient({ region: "us-west-2" });

  // Mock the send method
  (client as any).send = vi.fn();

  return client as BedrockRuntimeClient & {
    send: ReturnType<typeof vi.fn>;
  };
}
