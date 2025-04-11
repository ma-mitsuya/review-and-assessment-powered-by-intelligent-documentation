import { describe, it, expect, vi } from "vitest";
import fs from "fs";
import path from "path";
import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import { S3Utils } from "../../../core/utils";
import { combinePageResults } from "../combine-results";

// サンプルデータの読み込み
const sampleExtractedText = fs.readFileSync(
  path.join(__dirname, "assets", "sample-extracted-text.txt"),
  "utf-8"
);
const sampleLlmOcrText = fs.readFileSync(
  path.join(__dirname, "assets", "sample-llm-ocr.txt"),
  "utf-8"
);

// テスト用の推論設定
const inferenceConfig = {
  maxTokens: 4096,
  temperature: 0.7,
  topP: 0.9,
};

// このテストは実際のBedrockを呼び出すため、CI環境では実行しない
// 環境変数 RUN_INTEGRATION_TESTS=true の場合のみ実行
const shouldRunIntegrationTests = process.env.RUN_INTEGRATION_TESTS === "true";

// テストをスキップするための条件付きdescribe
const conditionalDescribe = shouldRunIntegrationTests
  ? describe
  : describe.skip;

conditionalDescribe("combinePageResults 統合テスト", () => {
  // タイムアウトを60秒に延長
  it("実際のBedrockを呼び出してJSONを生成する", async () => {
    // テスト用のドキュメントIDとページ番号
    const documentId = "test-doc-1";
    const pageNumber = 1;
    
    // S3モックの作成
    const s3Mock = {
      getObject: vi.fn().mockImplementation((key) => {
        if (key.includes("extracted-text")) {
          return Promise.resolve({ ok: true, value: Buffer.from(sampleExtractedText) });
        } else if (key.includes("llm-ocr")) {
          return Promise.resolve({ ok: true, value: Buffer.from(sampleLlmOcrText) });
        }
        return Promise.resolve({ ok: false, error: new Error("Not found") });
      }),
      uploadObject: vi.fn().mockResolvedValue({ ok: true }),
    } as unknown as S3Utils;
    
    // 実際のBedrockクライアントを作成
    const bedrockClient = new BedrockRuntimeClient({ region: "us-east-1" });
    
    // 関数を実行
    const result = await combinePageResults(
      { documentId, pageNumber },
      {
        s3: s3Mock,
        bedrock: bedrockClient,
        modelId: "anthropic.claude-3-sonnet-20240229-v1:0",
        inferenceConfig,
      }
    );
    
    // 結果を確認
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.documentId).toBe(documentId);
      expect(result.value.pageNumber).toBe(pageNumber);
    }
    
    // S3へのアップロード呼び出しを確認
    expect(s3Mock.uploadObject).toHaveBeenCalledTimes(1);
    
    // アップロードされたJSONの内容を確認
    const uploadCall = s3Mock.uploadObject.mock.calls[0];
    const uploadedContent = uploadCall[1].toString();
    console.log("Bedrock出力結果:");
    console.log(uploadedContent);
    
    // JSONとして解析可能か確認
    const parsedContent = JSON.parse(uploadedContent);
    expect(parsedContent).toHaveProperty("checklist_items");
    expect(parsedContent).toHaveProperty("meta_data");
    expect(parsedContent.meta_data).toHaveProperty("document_id", documentId);
    expect(parsedContent.meta_data).toHaveProperty("page_number", pageNumber);
  }, 60000); // タイムアウトを60秒に設定
});
