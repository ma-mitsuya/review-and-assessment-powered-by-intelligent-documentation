import "source-map-support/register";
import { FileType } from "../core/utils/file";
import { unwrapOrThrow } from "../core/utils/result";
import {
  processDocument,
  DocumentProcessResult,
} from "../features/document-processing";
import {
  CombinedPageResult,
  combinePageResults,
} from "../features/result-combining";
import { extractText, ExtractedTextResult } from "../features/text-extraction";
import { createS3Utils } from "../core/utils";
import {
  LlmProcessingResult,
  processWithLLM,
} from "../features/page-processing";
import { createBedrockRuntimeClient } from "../core/bedrock";
import { PDFDocument } from "pdf-lib";
import { aggregatePageResults } from "../features/aggregate-results/aggregate-results";
import { AggregatedDocumentResult } from "../features/aggregate-results/type";

/**
 * Lambda ハンドラー - Step Functionsからのイベントを処理
 */
export const handler = async (event: any): Promise<any> => {
  console.log("受信イベント:", JSON.stringify(event, null, 2));

  // アクションタイプに基づいて処理を分岐
  switch (event.action) {
    case "processDocument":
      return await handleProcessDocument(event);
    case "extractText":
      return await handleExtractText(event);
    case "processWithLLM":
      return await handleProcessWithLLM(event);
    case "combinePageResults":
      return await handleCombinePageResults(event);
    case "aggregatePageResults":
      return await handleAggregatePageResults(event);
    case "handleError":
      return await handleError(event);
    default:
      throw new Error(`未知のアクション: ${event.action}`);
  }
};

/**
 * ドキュメント処理ハンドラー
 */
async function handleProcessDocument(event: {
  documentId: string;
  fileName: string;
}): Promise<DocumentProcessResult> {
  const result = await processDocument(
    { documentId: event.documentId, fileName: event.fileName },
    { s3: createS3Utils(), pdfLib: { PDFDocument } }
  );
  return unwrapOrThrow(result);
}

/**
 * テキスト抽出ハンドラー
 */
async function handleExtractText(event: {
  documentId: string;
  pageNumber: number;
  fileType: FileType;
}): Promise<ExtractedTextResult> {
  const result = await extractText(
    {
      documentId: event.documentId,
      pageNumber: event.pageNumber,
      fileType: event.fileType,
    },
    {
      s3: createS3Utils(),
    }
  );
  return unwrapOrThrow(result);
}

async function handleProcessWithLLM(event: {
  documentId: string;
  pageNumber: number;
  fileType: string;
}): Promise<LlmProcessingResult> {
  const result = await processWithLLM(
    {
      documentId: event.documentId,
      pageNumber: event.pageNumber,
      fileType: event.fileType as FileType,
    },
    {
      s3: createS3Utils(),
      bedrock: createBedrockRuntimeClient(),
      // スロットリング回避のためHaiku
      modelId: "us.anthropic.claude-3-5-haiku-20241022-v1:0",
      inferenceConfig: {
        // Ref: https://docs.anthropic.com/en/docs/about-claude/models/all-models#model-comparison-table
        maxTokens: 8192,
        temperature: 0.7,
        topP: 0.999,
      },
    }
  );
  return unwrapOrThrow(result);
}

async function handleCombinePageResults(event: {
  parallelResults: {
    documentId: string;
    pageNumber: number;
    textExtraction?: { Payload: { documentId: string; pageNumber: number } };
    llmProcessing?: { Payload: { documentId: string; pageNumber: number } };
  }[];
}): Promise<CombinedPageResult> {
  const pageResult = event.parallelResults.find(
    (r) => r.textExtraction || r.llmProcessing
  );

  if (!pageResult) {
    throw new Error("parallelResults に処理対象が含まれていません");
  }

  const documentId = pageResult.documentId;
  const pageNumber = pageResult.pageNumber;

  const result = await combinePageResults(
    { documentId, pageNumber },
    {
      s3: createS3Utils(),
      bedrock: createBedrockRuntimeClient(),
      modelId: "us.anthropic.claude-3-5-haiku-20241022-v1:0",
      inferenceConfig: {
        maxTokens: 8192,
        temperature: 1.0,
        topP: 0.999,
      },
    }
  );

  return unwrapOrThrow(result);
}

async function handleAggregatePageResults(event: {
  documentId: string;
  processedPages: { pageNumber: number }[];
}): Promise<AggregatedDocumentResult> {
  const result = await aggregatePageResults(
    {
      documentId: event.documentId,
      processedPages: event.processedPages,
    },
    {
      s3: createS3Utils(),
    }
  );
  return unwrapOrThrow(result);
}

async function handleError(event: any): Promise<void> {
  throw new Error("Error occurred");
  // TODO
}
