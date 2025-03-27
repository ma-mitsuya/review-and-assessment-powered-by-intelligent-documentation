import { describe, it, expect, vi, beforeEach } from "vitest";
import { combinePageResults } from "../combine-results";
import { createMockS3Utils } from "../../../core/utils/s3.mock";
import { createMockBedrockRuntimeClient } from "../../../core/bedrock/bedrock-client.mock";
import { ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { ok, err } from "../../../core/utils/result";

describe("combinePageResults", () => {
  const documentId = "doc-test";
  const pageNumber = 5;
  const dummyText = "extracted text here";
  const dummyLlm = "llm output here";
  const dummyChecklist = "- [ ] 項目A\n- [ ] 項目B";

  let mockS3: ReturnType<typeof createMockS3Utils>;
  let mockBedrock: ReturnType<typeof createMockBedrockRuntimeClient>;

  beforeEach(() => {
    mockS3 = createMockS3Utils();
    mockBedrock = createMockBedrockRuntimeClient();
  });

  it("S3から読み込み、Bedrockに送信し、正常にチェックリストを生成", async () => {
    mockS3.getObject
      .mockResolvedValueOnce(ok(Buffer.from(dummyText))) // textKey
      .mockResolvedValueOnce(ok(Buffer.from(dummyLlm))); // llmKey
    mockBedrock.send.mockResolvedValueOnce({
      output: {
        message: {
          content: [{ type: "text", text: dummyChecklist }],
        },
      },
    });
    mockS3.uploadObject.mockResolvedValueOnce(ok(undefined));

    const result = await combinePageResults(
      { documentId, pageNumber },
      {
        s3: mockS3,
        bedrock: mockBedrock,
        modelId: "anthropic.claude-3-haiku-20240307-v1:0",
        inferenceConfig: {
          maxTokens: 512,
          temperature: 0.7,
          topP: 0.9,
        },
      }
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.documentId).toBe(documentId);
      expect(result.value.pageNumber).toBe(pageNumber);
    }

    expect(mockS3.getObject).toHaveBeenCalledTimes(2);
    expect(mockBedrock.send).toHaveBeenCalledWith(expect.any(ConverseCommand));
    expect(mockS3.uploadObject).toHaveBeenCalled();
  });

  it("S3のtext取得に失敗したらエラーを返す", async () => {
    mockS3.getObject
      .mockResolvedValueOnce(err(new Error("S3 text error"))) // textKey
      .mockResolvedValueOnce(ok(Buffer.from(dummyLlm))); // llmKey

    const result = await combinePageResults(
      { documentId, pageNumber },
      {
        s3: mockS3,
        bedrock: mockBedrock,
        modelId: "anthropic.claude-3-haiku-20240307-v1:0",
        inferenceConfig: {
          maxTokens: 512,
          temperature: 0.7,
          topP: 0.9,
        },
      }
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain("textKey");
    }
  });

  it("S3へのアップロードに失敗したらエラーを返す", async () => {
    mockS3.getObject
      .mockResolvedValueOnce(ok(Buffer.from(dummyText)))
      .mockResolvedValueOnce(ok(Buffer.from(dummyLlm)));
    mockBedrock.send.mockResolvedValueOnce({
      output: {
        message: {
          content: [{ type: "text", text: dummyChecklist }],
        },
      },
    });
    mockS3.uploadObject.mockResolvedValueOnce(err(new Error("upload fail")));

    const result = await combinePageResults(
      { documentId, pageNumber },
      {
        s3: mockS3,
        bedrock: mockBedrock,
        modelId: "anthropic.claude-3-haiku-20240307-v1:0",
        inferenceConfig: {
          maxTokens: 512,
          temperature: 0.7,
          topP: 0.9,
        },
      }
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain("S3への書き込み失敗");
    }
  });
});
