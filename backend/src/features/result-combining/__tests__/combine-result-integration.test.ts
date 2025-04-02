import { describe, it, expect, vi } from "vitest";
import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import { generateChecklist, validateCsvFormat, parseCsvToChecklist } from "../combine-results";
import fs from 'fs';
import path from 'path';
import { createPromptWithError } from "../prompt";

// サンプルデータの読み込み
const sampleExtractedText = fs.readFileSync(
  path.join(__dirname, 'assets', 'sample-extracted-text.txt'),
  'utf-8'
);
const sampleLlmOcrText = fs.readFileSync(
  path.join(__dirname, 'assets', 'sample-llm-ocr.txt'),
  'utf-8'
);

// サンプルの期待される出力を読み込み
const sampleChecklistOutput = fs.readFileSync(
  path.join(__dirname, 'assets', 'sample-checklist-output.csv'),
  'utf-8'
);

// テスト用の推論設定
const inferenceConfig = {
  maxTokens: 4096,
  temperature: 0.7,
  topP: 0.9
};

// このテストは実際のBedrockを呼び出すため、CI環境では実行しない
// 環境変数 RUN_INTEGRATION_TESTS=true の場合のみ実行
const shouldRunIntegrationTests = process.env.RUN_INTEGRATION_TESTS === "true";

// テストをスキップするための条件付きdescribe
const conditionalDescribe = shouldRunIntegrationTests ? describe : describe.skip;

describe("generateChecklist with mocks", () => {
  // Bedrockクライアントのモック
  const mockBedrockSend = vi.fn();
  const mockBedrock = {
    send: mockBedrockSend
  };

  beforeEach(() => {
    // モックをリセット
    vi.resetAllMocks();
    
    // モックレスポンスを設定
    mockBedrockSend.mockResolvedValue({
      output: {
        message: {
          content: [
            { text: sampleChecklistOutput }
          ]
        }
      }
    });
  });

  it("モックBedrockを使用してチェックリストを生成できる", async () => {
    // モックBedrockを使用してチェックリストを生成
    const result = await generateChecklist(
      sampleExtractedText,
      sampleLlmOcrText,
      mockBedrock as any,
      "anthropic.claude-3-sonnet-20240229-v1:0",
      inferenceConfig
    );

    // 結果が成功していることを確認
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    // 生成されたCSVの内容を検証
    const csv = result.value;
    console.log("Generated CSV:", csv);

    // CSVをパースしてチェックリストオブジェクトに変換できることを確認
    const parseResult = parseCsvToChecklist(csv);
    expect(parseResult.ok).toBe(true);
    if (!parseResult.ok) return;

    // チェックリストの内容を検証
    const checklist = parseResult.value;
    expect(checklist.items.length).toBeGreaterThan(0);

    // 建築主情報が含まれていることを確認
    const hasOwnerInfo = checklist.items.some(item => 
      item.name.includes("建築主") || item.condition.includes("建築主")
    );
    expect(hasOwnerInfo).toBe(true);

    // 設計者情報が含まれていることを確認
    const hasDesignerInfo = checklist.items.some(item => 
      item.name.includes("設計者") || item.condition.includes("設計者")
    );
    expect(hasDesignerInfo).toBe(true);
  });

  it("エラー情報を含むプロンプトでチェックリストを生成できる", async () => {
    // エラー情報を含むプロンプトを作成
    const errorDetails = "CSV検証エラー: 行 2 のrequiredフィールドが不正です: \"yes\"";

    // モックレスポンスを設定（エラー情報を含むプロンプト用）
    mockBedrockSend.mockResolvedValue({
      output: {
        message: {
          content: [
            { text: sampleChecklistOutput }
          ]
        }
      }
    });

    // モックBedrockを使用してチェックリストを生成
    const result = await generateChecklist(
      sampleExtractedText,
      sampleLlmOcrText,
      mockBedrock as any,
      "anthropic.claude-3-sonnet-20240229-v1:0",
      inferenceConfig,
      errorDetails
    );

    // 結果が成功していることを確認
    console.log("Error result:", result);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      console.error("Error:", result.error);
      return;
    }

    // 生成されたCSVの内容を検証
    const csv = result.value;
    console.log("Generated CSV with error info:", csv);

    // CSVをパースしてチェックリストオブジェクトに変換できることを確認
    const parseResult = parseCsvToChecklist(csv);
    expect(parseResult.ok).toBe(true);
  });
});

// 実際のBedrockを使用するテスト
conditionalDescribe("generateChecklist (Integration)", () => {
  // テストタイムアウトを長めに設定（Bedrockの応答を待つため）
  vi.setConfig({ testTimeout: 30000 });

  it("実際のBedrockを使用してチェックリストを生成できる", async () => {
    // 実際のBedrockクライアントを作成
    const bedrock = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || "us-west-2"
    });

    // 実際のBedrockを呼び出してチェックリストを生成
    const result = await generateChecklist(
      sampleExtractedText,
      sampleLlmOcrText,
      bedrock,
      "anthropic.claude-3-sonnet-20240229-v1:0",
      inferenceConfig
    );

    // 結果が成功していることを確認
    expect(result.ok).toBe(true);
    if (!result.ok) {
      console.error("Error:", result.error);
      return;
    }

    // 生成されたCSVの内容を検証
    const csv = result.value;
    console.log("Generated CSV:", csv);

    // CSVをパースしてチェックリストオブジェクトに変換できることを確認
    const parseResult = parseCsvToChecklist(csv);
    expect(parseResult.ok).toBe(true);
    if (!parseResult.ok) {
      console.error("Parse error:", parseResult.error);
      return;
    }

    // チェックリストの内容を検証
    const checklist = parseResult.value;
    expect(checklist.items.length).toBeGreaterThan(0);

    // 建築主情報が含まれていることを確認
    const hasOwnerInfo = checklist.items.some(item => 
      item.name.includes("建築主") || item.condition.includes("建築主")
    );
    expect(hasOwnerInfo).toBe(true);
  });
});

describe("createPromptWithError", () => {
  it("エラー情報を含むプロンプトを生成", () => {
    const basePrompt = "これはベースプロンプトです";
    const errorDetails = "これはエラー詳細です";
    
    const result = createPromptWithError(basePrompt, errorDetails);
    
    expect(result).toContain(basePrompt);
    expect(result).toContain("<error-information>");
    expect(result).toContain(errorDetails);
    expect(result).toContain("</error-information>");
  });
});
