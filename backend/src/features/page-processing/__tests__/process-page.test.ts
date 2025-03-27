import { describe, it, vi, expect, beforeEach } from "vitest";
import { processWithLLM } from "../process-page";
import { createMockBedrockRuntimeClient } from "../../../core/bedrock/bedrock-client.mock";
import { createMockS3Utils, MockS3Utils } from "../../../core/utils/s3.mock";
import { ok, err } from "../../../core/utils/result";
import { ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { FileType } from "../../../core/utils/file";

describe("processWithLLM", () => {
  const dummyFileBuffer = Buffer.from("This is a test file.");
  const dummyResponse = {
    output: {
      message: {
        content: [
          { type: "text", text: "## Markdown Heading\nThis is content." },
        ],
      },
    },
  };

  let mockS3: MockS3Utils;
  let mockBedrock: ReturnType<typeof createMockBedrockRuntimeClient>;

  beforeEach(() => {
    mockS3 = createMockS3Utils();
    mockBedrock = createMockBedrockRuntimeClient();
  });

  it("正常にMarkdownを返す (text)", async () => {
    mockS3.getObject.mockResolvedValueOnce(ok(dummyFileBuffer));
    mockBedrock.send.mockResolvedValueOnce(dummyResponse);
    mockS3.uploadObject.mockResolvedValue(ok(undefined));

    const result = await processWithLLM(
      {
        documentId: "doc-1",
        pageNumber: 1,
        fileType: "text",
      },
      {
        s3: mockS3,
        bedrock: mockBedrock,
        modelId: "claude-3-test",
        inferenceConfig: {
          maxTokens: 1000,
          temperature: 0.5,
          topP: 0.9,
        },
      }
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.documentId).toBe("doc-1");
    }

    expect(mockS3.getObject).toHaveBeenCalledOnce();
    expect(mockBedrock.send).toHaveBeenCalledWith(expect.any(ConverseCommand));
  });

  it("S3からの取得に失敗した場合はエラーを返す", async () => {
    mockS3.getObject.mockResolvedValueOnce(err(new Error("S3 error")));

    const result = await processWithLLM(
      {
        documentId: "doc-2",
        pageNumber: 2,
        fileType: "text",
      },
      {
        s3: mockS3,
        bedrock: mockBedrock,
        modelId: "claude-3-test",
        inferenceConfig: {
          maxTokens: 1000,
          temperature: 0.5,
          topP: 0.9,
        },
      }
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toMatch(/S3 error/);
    }
  });

  it("不正なfileTypeを指定した場合はエラーを返す", async () => {
    mockS3.getObject.mockResolvedValueOnce(ok(dummyFileBuffer));

    const result = await processWithLLM(
      {
        documentId: "doc-3",
        pageNumber: 3,
        fileType: "zip" as FileType,
      },
      {
        s3: mockS3,
        bedrock: mockBedrock,
        modelId: "claude-3-test",
        inferenceConfig: {
          maxTokens: 1000,
          temperature: 0.5,
          topP: 0.9,
        },
      }
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain("未対応のファイル形式");
    }
  });

  it("Bedrockクライアントが例外を投げたらエラーを返す", async () => {
    mockS3.getObject.mockResolvedValueOnce(ok(dummyFileBuffer));
    mockBedrock.send.mockRejectedValueOnce(new Error("Bedrock error"));

    const result = await processWithLLM(
      {
        documentId: "doc-4",
        pageNumber: 4,
        fileType: "text",
      },
      {
        s3: mockS3,
        bedrock: mockBedrock,
        modelId: "claude-3-test",
        inferenceConfig: {
          maxTokens: 1000,
          temperature: 0.5,
          topP: 0.9,
        },
      }
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain("Bedrock error");
    }
  });
});
