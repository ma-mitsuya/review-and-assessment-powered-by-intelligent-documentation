import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  combinePageResults,
  validateCsvFormat,
  extractCsvFields,
  generateChecklist,
  generateValidChecklist,
} from "../combine-results";
import { createMockS3Utils } from "../../../core/utils/s3.mock";
import { createMockBedrockRuntimeClient } from "../../../core/bedrock/bedrock-client.mock";
import { ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { ok, err } from "../../../core/utils/result";

describe("combinePageResults", () => {
  const documentId = "doc-test";
  const pageNumber = 5;
  const dummyText = "extracted text here";
  const dummyLlm = "llm output here";
  const validCsv =
    "id,name,condition\n1,契約解除条項の存在確認,契約解除に関する条項が存在する";
  const invalidCsv = "項目A\n項目B";

  let mockS3: ReturnType<typeof createMockS3Utils>;
  let mockBedrock: ReturnType<typeof createMockBedrockRuntimeClient>;

  beforeEach(() => {
    mockS3 = createMockS3Utils();
    mockBedrock = createMockBedrockRuntimeClient();
    vi.clearAllMocks();
  });

  it("S3から読み込み、Bedrockに送信し、正常にチェックリストを生成", async () => {
    mockS3.getObject
      .mockResolvedValueOnce(ok(Buffer.from(dummyText))) // textKey
      .mockResolvedValueOnce(ok(Buffer.from(dummyLlm))); // llmKey
    mockBedrock.send.mockResolvedValueOnce({
      output: {
        message: {
          content: [{ type: "text", text: validCsv }],
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
          content: [{ type: "text", text: validCsv }],
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

  // リトライロジックのテスト
  it("無効なCSVを返した場合に正常にリトライする", async () => {
    mockS3.getObject
      .mockResolvedValueOnce(ok(Buffer.from(dummyText)))
      .mockResolvedValueOnce(ok(Buffer.from(dummyLlm)));

    // 1回目は無効なCSV、2回目は有効なCSVを返す
    mockBedrock.send
      .mockResolvedValueOnce({
        output: {
          message: {
            content: [{ type: "text", text: invalidCsv }],
          },
        },
      })
      .mockResolvedValueOnce({
        output: {
          message: {
            content: [{ type: "text", text: validCsv }],
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
    // Bedrockが2回呼ばれたことを確認（リトライ含む）
    expect(mockBedrock.send).toHaveBeenCalledTimes(2);
    expect(mockS3.uploadObject).toHaveBeenCalled();
  });

  it("すべてのリトライが失敗した場合にエラーを返す", async () => {
    mockS3.getObject
      .mockResolvedValueOnce(ok(Buffer.from(dummyText)))
      .mockResolvedValueOnce(ok(Buffer.from(dummyLlm)));

    // すべての試行で無効なCSVを返す
    mockBedrock.send
      .mockResolvedValueOnce({
        output: {
          message: {
            content: [{ type: "text", text: invalidCsv }],
          },
        },
      })
      .mockResolvedValueOnce({
        output: {
          message: {
            content: [{ type: "text", text: invalidCsv }],
          },
        },
      })
      .mockResolvedValueOnce({
        output: {
          message: {
            content: [{ type: "text", text: invalidCsv }],
          },
        },
      });

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
      expect(result.error.message).toContain("有効なCSVの生成に失敗");
    }
    // 最大リトライ回数+1回呼ばれたことを確認
    expect(mockBedrock.send).toHaveBeenCalledTimes(3);
    expect(mockS3.uploadObject).not.toHaveBeenCalled();
  });
});

describe("validateCsvFormat", () => {
  it("有効なCSVフォーマットを検証", () => {
    const validCsv = "id,name,condition\n1,項目A,条件A\n1.1,項目B,条件B";
    const result = validateCsvFormat(validCsv);
    expect(result.isValid).toBe(true);
  });

  it("ヘッダーが不正な場合は無効", () => {
    const invalidHeaderCsv = "ID,項目,条件\n1,項目A,条件A";
    const result = validateCsvFormat(invalidHeaderCsv);
    expect(result.isValid).toBe(false);
    expect(result.message).toContain("ヘッダーが不正です");
  });

  it("フィールド数が3つでない行があれば無効", () => {
    const invalidFieldsCsv = "id,name,condition\n1,項目A\n1.1,項目B,条件B";
    const result = validateCsvFormat(invalidFieldsCsv);
    expect(result.isValid).toBe(false);
    expect(result.message).toContain("フィールド数が不正です");
  });

  it("IDフィールドが数字とドット以外を含む場合は無効", () => {
    const invalidIdCsv = "id,name,condition\n1a,項目A,条件A";
    const result = validateCsvFormat(invalidIdCsv);
    expect(result.isValid).toBe(false);
    expect(result.message).toContain("idフィールドが不正です");
  });

  it("空のCSVは無効", () => {
    const result = validateCsvFormat("");
    expect(result.isValid).toBe(false);
    expect(result.message).toContain("CSVが空です");
  });
});

describe("extractCsvFields", () => {
  it("標準的なCSV行からフィールドを抽出", () => {
    const line = "1,項目A,条件A";
    const fields = extractCsvFields(line);
    expect(fields).toEqual(["1", "項目A", "条件A"]);
  });

  it("引用符で囲まれたカンマを含むフィールドを正しく抽出", () => {
    const line = '1,"項目A, 続き",条件A';
    const fields = extractCsvFields(line);
    expect(fields).toEqual(["1", '"項目A, 続き"', "条件A"]);
  });
});

describe("generateChecklist", () => {
  let mockBedrock: ReturnType<typeof createMockBedrockRuntimeClient>;

  beforeEach(() => {
    mockBedrock = createMockBedrockRuntimeClient();
    vi.clearAllMocks();
  });

  it("成功時にチェックリストを返す", async () => {
    const validCsv = "id,name,condition\n1,項目A,条件A";
    mockBedrock.send.mockResolvedValueOnce({
      output: {
        message: {
          content: [{ type: "text", text: validCsv }],
        },
      },
    });

    const result = await generateChecklist(
      "テキスト",
      "OCR結果",
      mockBedrock,
      "anthropic.claude-3-haiku-20240307-v1:0",
      {}
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe(validCsv);
    }
    expect(mockBedrock.send).toHaveBeenCalledTimes(1);
  });

  it("APIエラー時にエラーを返す", async () => {
    mockBedrock.send.mockRejectedValueOnce(new Error("API error"));

    const result = await generateChecklist(
      "テキスト",
      "OCR結果",
      mockBedrock,
      "anthropic.claude-3-haiku-20240307-v1:0",
      {}
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe("API error");
    }
  });
});
describe("generateValidChecklist", () => {
  let mockBedrock: ReturnType<typeof createMockBedrockRuntimeClient>;

  beforeEach(() => {
    mockBedrock = createMockBedrockRuntimeClient();
    vi.clearAllMocks();
  });

  it("最初の試行で有効なCSVを返した場合は成功", async () => {
    const validCsv = "id,name,condition\n1,項目A,条件A";
    mockBedrock.send.mockResolvedValueOnce({
      output: {
        message: {
          content: [{ type: "text", text: validCsv }],
        },
      },
    });

    const result = await generateValidChecklist(
      "テキスト",
      "OCR結果",
      mockBedrock,
      "anthropic.claude-3-haiku-20240307-v1:0",
      {},
      2
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe(validCsv);
    }
    expect(mockBedrock.send).toHaveBeenCalledTimes(1);
  });

  it("最初の試行で失敗、2回目で成功する場合", async () => {
    const invalidCsv = "項目A,条件A\n項目B,条件B";
    const validCsv = "id,name,condition\n1,項目A,条件A";

    mockBedrock.send
      .mockResolvedValueOnce({
        output: {
          message: {
            content: [{ type: "text", text: invalidCsv }],
          },
        },
      })
      .mockResolvedValueOnce({
        output: {
          message: {
            content: [{ type: "text", text: validCsv }],
          },
        },
      });

    const result = await generateValidChecklist(
      "テキスト",
      "OCR結果",
      mockBedrock,
      "anthropic.claude-3-haiku-20240307-v1:0",
      {},
      2
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe(validCsv);
    }
    expect(mockBedrock.send).toHaveBeenCalledTimes(2);
  });

  it("すべての試行が失敗する場合", async () => {
    const invalidCsv = "項目A,条件A\n項目B,条件B";

    mockBedrock.send
      .mockResolvedValueOnce({
        output: {
          message: {
            content: [{ type: "text", text: invalidCsv }],
          },
        },
      })
      .mockResolvedValueOnce({
        output: {
          message: {
            content: [{ type: "text", text: invalidCsv }],
          },
        },
      })
      .mockResolvedValueOnce({
        output: {
          message: {
            content: [{ type: "text", text: invalidCsv }],
          },
        },
      });

    const result = await generateValidChecklist(
      "テキスト",
      "OCR結果",
      mockBedrock,
      "anthropic.claude-3-haiku-20240307-v1:0",
      {},
      2
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain("有効なCSVの生成に失敗");
    }
    expect(mockBedrock.send).toHaveBeenCalledTimes(3); // 初回 + リトライ2回
  });

  it("生成自体に失敗した場合", async () => {
    mockBedrock.send.mockRejectedValue(new Error("API error"));

    const result = await generateValidChecklist(
      "テキスト",
      "OCR結果",
      mockBedrock,
      "anthropic.claude-3-haiku-20240307-v1:0",
      {},
      2
    );

    expect(result.ok).toBe(false);
    expect(mockBedrock.send).toHaveBeenCalledTimes(3); // 初回 + リトライ2回
  });

  it("最大リトライ回数を指定した場合", async () => {
    const invalidCsv = "項目A,条件A";

    // すべての呼び出しで無効なCSVを返す
    mockBedrock.send.mockResolvedValue({
      output: {
        message: {
          content: [{ type: "text", text: invalidCsv }],
        },
      },
    });

    const maxRetries = 4;
    const result = await generateValidChecklist(
      "テキスト",
      "OCR結果",
      mockBedrock,
      "anthropic.claude-3-haiku-20240307-v1:0",
      {},
      maxRetries
    );

    expect(result.ok).toBe(false);
    // 初回 + maxRetries回の呼び出し
    expect(mockBedrock.send).toHaveBeenCalledTimes(maxRetries + 1);
  });
});

// エッジケースのテスト
describe("エッジケース", () => {
  it("validateCsvFormat: 空行を含むCSV", () => {
    const csvWithEmptyLine =
      "id,name,condition\n1,項目A,条件A\n\n2,項目B,条件B";
    const result = validateCsvFormat(csvWithEmptyLine);
    expect(result.isValid).toBe(true); // 空行はスキップされるべき
  });

  it("validateCsvFormat: 引用符内のカンマを含むCSV", () => {
    const csvWithQuotedCommas = 'id,name,condition\n1,"項目A, 続き",条件A';
    const result = validateCsvFormat(csvWithQuotedCommas);
    expect(result.isValid).toBe(true); // 引用符内のカンマは問題ない
  });

  it("extractCsvFields: 複雑な引用符パターン", () => {
    const line = '1,"項目""A""",条件A';
    const fields = extractCsvFields(line);
    expect(fields).toEqual(["1", '"項目""A"""', "条件A"]);
  });

  it("extractCsvFields: 空のフィールドを含む行", () => {
    const line = "1,,条件A";
    const fields = extractCsvFields(line);
    expect(fields).toEqual(["1", "", "条件A"]);
  });
});
