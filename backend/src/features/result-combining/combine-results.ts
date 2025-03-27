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

  const textKey = getPageExtractedTextKey(documentId, pageNumber);
  const llmKey = getPageLlmOcrTextKey(documentId, pageNumber);

  const [textRes, llmRes] = await Promise.all([
    s3.getObject(textKey),
    s3.getObject(llmKey),
  ]);

  if (!textRes.ok || !llmRes.ok) {
    return err(
      new Error(
        `S3からの読み込み失敗: ${
          !textRes.ok ? `textKey (${textKey})` : `llmKey (${llmKey})`
        }`
      )
    );
  }

  const text = textRes.value.toString("utf-8");
  const llm = llmRes.value.toString("utf-8");

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
    const response = await bedrock.send(
      new ConverseCommand({ modelId, messages, inferenceConfig })
    );

    // ContentBlockオブジェクトの型を適切に判定
    checklist = (response.output?.message?.content ?? [])
      .filter((c) => 'text' in c)
      .map((c) => (c as { text: string }).text)
      .join("");
  } catch (e) {
    return err(e instanceof Error ? e : new Error("LLM呼び出し失敗"));
  }

  // S3に書き込む
  const combinedKey = getPageCombinedKey(documentId, pageNumber);
  const result = await s3.uploadObject(combinedKey, Buffer.from(checklist));
  if (!result.ok) {
    return err(new Error("S3への書き込み失敗"));
  }

  return ok({ documentId, pageNumber });
}
