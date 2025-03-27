import {
  BedrockRuntimeClient,
  ConverseCommand,
  Message,
} from "@aws-sdk/client-bedrock-runtime";
import { err, ok, Result, S3Utils } from "../../core/utils";
import {
  getPageCombinedKey,
  getPageExtractedTextKey,
  getPageLlmOcrTextKey,
} from "../common/storage-paths";
import { CombinedPageResult } from "./types";
import { CHECKLIST_PROMPT } from "./prompt";
import { modelId } from "../../core/bedrock/model-id";

export async function combinePageResults(
  params: {
    documentId: string;
    pageNumber: number;
  },
  deps: {
    s3: S3Utils;
    bedrock: BedrockRuntimeClient;
    modelId: modelId;
    inferenceConfig: {
      maxTokens: number;
      temperature: number;
      topP: number;
    };
  }
): Promise<Result<CombinedPageResult, Error>> {
  const { documentId, pageNumber } = params;
  const { s3, bedrock, modelId, inferenceConfig } = deps;

  console.log(`[combinePageResults] 開始: documentId=${documentId}, pageNumber=${pageNumber}, modelId=${modelId}`);

  const textKey = getPageExtractedTextKey(documentId, pageNumber);
  const llmKey = getPageLlmOcrTextKey(documentId, pageNumber);
  
  console.log(`[combinePageResults] S3からデータ取得開始: textKey=${textKey}, llmKey=${llmKey}`);

  const [textRes, llmRes] = await Promise.all([
    s3.getObject(textKey),
    s3.getObject(llmKey),
  ]);

  if (!textRes.ok || !llmRes.ok) {
    const errorKey = !textRes.ok ? textKey : llmKey;
    const errorMessage = !textRes.ok ? textRes.error.message : llmRes.error.message;
    console.error(`[combinePageResults] S3からの読み込み失敗: ${errorKey} - ${errorMessage}`);
    return err(
      new Error(
        `S3からの読み込み失敗: ${
          !textRes.ok ? `textKey (${textKey})` : `llmKey (${llmKey})`
        }`
      )
    );
  }

  console.log(`[combinePageResults] S3からデータ取得成功`);
  const text = textRes.value.toString("utf-8");
  const llm = llmRes.value.toString("utf-8");
  
  console.log(`[combinePageResults] 抽出テキスト: ${text.length}文字, LLM結果: ${llm.length}文字`);

  const messages: Message[] = [
    {
      role: "user",
      content: [
        { text: CHECKLIST_PROMPT },
        {
          text: `<extracted-text>\n${text}\n</extracted-text>\n<llm-ocr>\n${llm}</llm-ocr>`,
        },
      ],
    },
  ];

  let checklist = "";
  try {
    console.log(`[combinePageResults] Bedrock API呼び出し開始`);
    const response = await bedrock.send(
      new ConverseCommand({ modelId, messages, inferenceConfig })
    );
    console.log(`[combinePageResults] Bedrock API呼び出し成功`);

    // ContentBlockオブジェクトの型を適切に判定
    checklist = (response.output?.message?.content ?? [])
      .filter((c) => 'text' in c)
      .map((c) => (c as { text: string }).text)
      .join("");
    
    console.log(`[combinePageResults] 生成されたチェックリスト: ${checklist.length}文字`);
  } catch (e) {
    console.error(`[combinePageResults] Bedrock API呼び出しエラー: ${e instanceof Error ? e.message : String(e)}`);
    return err(e instanceof Error ? e : new Error("LLM呼び出し失敗"));
  }

  // S3に書き込む
  const combinedKey = getPageCombinedKey(documentId, pageNumber);
  console.log(`[combinePageResults] 結果をS3に保存開始: ${combinedKey}`);
  const result = await s3.uploadObject(combinedKey, Buffer.from(checklist));
  if (!result.ok) {
    console.error(`[combinePageResults] S3への書き込み失敗: ${result.error.message}`);
    return err(new Error("S3への書き込み失敗"));
  }
  console.log(`[combinePageResults] S3への書き込み成功`);

  console.log(`[combinePageResults] 処理完了: documentId=${documentId}, pageNumber=${pageNumber}`);
  return ok({ documentId, pageNumber });
}
