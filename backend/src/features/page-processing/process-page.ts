// ファイル名: processWithLLM.ts

import { Result, ok, err, unwrapOrThrow } from "../../core/utils/result";
import { LlmProcessingResult } from "./types";
import {
  Message,
  ContentBlock,
  ConverseCommand,
  BedrockRuntimeClient,
} from "@aws-sdk/client-bedrock-runtime";
import { FileType } from "../../core/utils/file";
import { PDF_PAGE_PROMPT } from "./prompt";
import { S3Utils } from "../../core/utils/s3";
import { getPageLlmOcrTextKey, getPagePdfKey } from "../common/storage-paths";

export async function processWithLLM(
  params: {
    documentId: string;
    pageNumber: number;
    fileType: FileType;
  },
  deps: {
    s3: S3Utils;
    bedrock: BedrockRuntimeClient;
    modelId: string;
    inferenceConfig: {
      maxTokens: number;
      temperature: number;
      topP: number;
    };
  }
): Promise<Result<LlmProcessingResult, Error>> {
  const { documentId, pageNumber, fileType } = params;
  const { s3, bedrock, modelId, inferenceConfig } = deps;

  const getResult = await s3.getObject(getPagePdfKey(documentId, pageNumber));
  if (!getResult.ok) return err(getResult.error);
  const fileBuffer = getResult.value;

  const messageResult = buildLlmMessagesFromFile(fileBuffer, fileType);
  if (!messageResult.ok) return err(messageResult.error);
  const messages = messageResult.value;

  let markdownContent = "";
  try {
    const command = new ConverseCommand({
      modelId,
      messages,
      inferenceConfig,
    });

    const response = await bedrock.send(command);
    const contentBlocks = response.output?.message?.content ?? [];

    markdownContent = contentBlocks
      .filter((c): c is { type: "text"; text: string } => c.type === "text")
      .map((c) => c.text)
      .join("");
  } catch (e) {
    return err(
      e instanceof Error ? e : new Error("LLM処理中にエラーが発生しました")
    );
  }

  // 結果を保存
  const key = getPageLlmOcrTextKey(documentId, pageNumber);
  const saveResult = await s3.uploadObject(
    key,
    Buffer.from(markdownContent),
    "text/markdown"
  );
  console.log(`saveResult: ${saveResult}`);
  if (!saveResult.ok) return err(saveResult.error);

  return ok({ documentId, pageNumber });
}

/**
 * ファイル内容からLLM向けメッセージを生成する
 */
export function buildLlmMessagesFromFile(
  fileBuffer: Buffer,
  fileType: FileType
): Result<Message[], Error> {
  switch (fileType) {
    case "text": {
      const textBlock: ContentBlock = {
        text:
          "以下のテキストをMarkdown形式で構造化してください。\n\n" +
          fileBuffer.toString("utf-8"),
      };
      return ok([{ role: "user", content: [textBlock] }]);
    }

    case "pdf": {
      const docBlock: ContentBlock = {
        document: {
          name: `page.pdf`,
          format: "pdf",
          source: {
            bytes: Uint8Array.from(fileBuffer),
          },
        },
      };

      const promptBlock: ContentBlock = {
        text: PDF_PAGE_PROMPT,
      };

      return ok([{ role: "user", content: [docBlock, promptBlock] }]);
    }

    default:
      return err(new Error(`未対応のファイル形式です: ${fileType}`));
  }
}
