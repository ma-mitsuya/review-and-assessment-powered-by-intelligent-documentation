// ファイル名: processWithLLM.ts

import { Result, ok, err, unwrapOrThrow } from "../../core/utils/result";
import { LlmProcessingResult } from "./types";
import {
  Message,
  ContentBlock,
  ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { FileType } from "../../core/utils/file";
import { PDF_PAGE_PROMPT } from "./prompt";
import { S3Utils } from "../../core/utils/s3";
import { getPageLlmOcrTextKey, getPagePdfKey } from "../common/storage-paths";
import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";

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

  console.log(`[processWithLLM] 開始: documentId=${documentId}, pageNumber=${pageNumber}, fileType=${fileType}, modelId=${modelId}`);

  console.log(`[processWithLLM] S3からファイル取得開始`);
  const getResult = await s3.getObject(getPagePdfKey(documentId, pageNumber));
  if (!getResult.ok) {
    console.error(`[processWithLLM] S3からのファイル取得失敗: ${getResult.error.message}`);
    return err(getResult.error);
  }
  const fileBuffer = getResult.value;
  console.log(`[processWithLLM] S3からファイル取得成功: サイズ=${fileBuffer.length}バイト`);

  console.log(`[processWithLLM] LLMメッセージ構築開始`);
  const messageResult = buildLlmMessagesFromFile(fileBuffer, fileType);
  if (!messageResult.ok) {
    console.error(`[processWithLLM] LLMメッセージ構築失敗: ${messageResult.error.message}`);
    return err(messageResult.error);
  }
  const messages = messageResult.value;
  console.log(`[processWithLLM] LLMメッセージ構築成功`);

  let markdownContent = "";
  try {
    console.log(`[processWithLLM] Bedrock API呼び出し開始: modelId=${modelId}`);
    const command = new ConverseCommand({
      modelId,
      messages,
      inferenceConfig,
    });

    const response = await bedrock.send(command);
    console.log(`[processWithLLM] Bedrock API呼び出し成功`);
    
    const contentBlocks = response.output?.message?.content ?? [];
    console.log(`[processWithLLM] レスポンスブロック数: ${contentBlocks.length}`);

    markdownContent = contentBlocks
      .filter((c) => c.hasOwnProperty("text"))
      .map((c: any) => c.text)
      .join("");
    
    console.log(`[processWithLLM] 抽出されたマークダウン: ${markdownContent.length}文字`);
  } catch (e) {
    console.error(`[processWithLLM] Bedrock API呼び出しエラー: ${e instanceof Error ? e.message : String(e)}`);
    return err(
      e instanceof Error ? e : new Error("LLM処理中にエラーが発生しました")
    );
  }

  // 結果を保存
  const key = getPageLlmOcrTextKey(documentId, pageNumber);
  console.log(`[processWithLLM] 結果をS3に保存開始: ${key}`);
  const saveResult = await s3.uploadObject(
    key,
    Buffer.from(markdownContent),
    "text/markdown"
  );
  
  if (!saveResult.ok) {
    console.error(`[processWithLLM] S3への保存失敗: ${saveResult.error.message}`);
    return err(saveResult.error);
  }
  console.log(`[processWithLLM] S3への保存成功`);

  console.log(`[processWithLLM] 処理完了: documentId=${documentId}, pageNumber=${pageNumber}`);
  return ok({ documentId, pageNumber });
}

/**
 * ファイル内容からLLM向けメッセージを生成する
 */
export function buildLlmMessagesFromFile(
  fileBuffer: Buffer,
  fileType: FileType
): Result<Message[], Error> {
  console.log(`[buildLlmMessagesFromFile] 開始: fileType=${fileType}, bufferSize=${fileBuffer.length}`);
  
  switch (fileType) {
    case "text": {
      console.log(`[buildLlmMessagesFromFile] テキストファイル処理`);
      const textBlock: ContentBlock = {
        text:
          "以下のテキストをMarkdown形式で構造化してください。\n\n" +
          fileBuffer.toString("utf-8"),
      };
      return ok([{ role: "user", content: [textBlock] }]);
    }

    case "pdf": {
      console.log(`[buildLlmMessagesFromFile] PDFファイル処理`);
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
      console.error(`[buildLlmMessagesFromFile] 未対応のファイル形式: ${fileType}`);
      return err(new Error(`未対応のファイル形式です: ${fileType}`));
  }
}
