import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import {
  BedrockRuntimeClient,
  ConverseCommand,
  TokenUsage,
} from "@aws-sdk/client-bedrock-runtime";
import {
  makePrismaReviewJobRepository,
  makePrismaReviewResultRepository,
} from "../../api/features/review/domain/repository";
import { makePrismaUserPreferenceRepository } from "../../api/features/user-preference/domain/repository";
import {
  REVIEW_FILE_TYPE,
  ReviewResultDomain,
} from "../../api/features/review/domain/model/review";
import { makePrismaCheckRepository } from "../../api/features/checklist/domain/repository";
import { processImageReviewItem } from "./image-review-processor";
import { getLanguageName, DEFAULT_LANGUAGE } from "../../utils/language";

// Define model ID
const MODEL_ID = "us.anthropic.claude-3-7-sonnet-20250219-v1:0"; // Sonnet 3.7

const BEDROCK_REGION = process.env.BEDROCK_REGION || "us-west-2";

// Helper function to get the review prompt based on language
const getReviewPrompt = (language: string) => {
  const languageName = getLanguageName(language);

  return `
You are an AI assistant that reviews documents.
Please review the provided document based on the following check item.

Check item: {checkName}
Description: {checkDescription}

Document content:
{documentContent}

## IMPORTANT OUTPUT LANGUAGE REQUIREMENT
YOU MUST GENERATE THE ENTIRE OUTPUT IN ${languageName}.
THIS IS A STRICT REQUIREMENT. ALL TEXT INCLUDING ALL JSON FIELD VALUES MUST BE IN ${languageName}.

Determine whether the document complies with this check item and respond in JSON format as follows.
It is strictly forbidden to output anything other than JSON. Do not use markdown syntax (like \`\`\`json), return only pure JSON.

{
  "result": "pass" or "fail",
  "confidence": A number between 0 and 1 (confidence level),
  "explanation": "Explanation of the judgment (IN ${languageName})",
  "shortExplanation": "Short summary of judgment (within 80 characters) (IN ${languageName})",
  "extractedText": "Relevant extracted text (IN ${languageName})",
  "pageNumber": Page number where the extracted text is found (integer starting from 1)
}

Examples of confidence scores:
- High confidence (0.9-1.0): When the document contains clear information and the compliance with the check item is obvious
- Medium confidence (0.7-0.89): When the document contains relevant information but it's not completely clear
- Low confidence (0.5-0.69): When the document contains ambiguous information and there is uncertainty in the judgment

The shortExplanation should be a concise summary of the judgment within 80 characters.
For example: "Pass because signatures and seals are confirmed on the contract" or "Fail because property area is not mentioned"

Example response (note: the examples below are in English, but YOUR RESPONSE MUST BE IN ${languageName}):

Example 1 (high confidence pass):
{
  "result": "pass",
  "confidence": 0.95,
  "explanation": "The contract clearly states the contractor's name, address, and contact information in Article 3. All required information is present and accurate.",
  "shortExplanation": "Pass because contractor information is clearly stated in Article 3 of the contract",
  "extractedText": "Article 3 (Contractor Information) Contractor: John Smith, Address: 123 Main St...",
  "pageNumber": 2
}

Example 2 (medium confidence fail):
{
  "result": "fail",
  "confidence": 0.82,
  "explanation": "While the property location is mentioned in the contract, there is no mention of the property area. The check item requires the area to be specified.",
  "shortExplanation": "Fail because property area is not mentioned despite having property location",
  "extractedText": "Property location: 1-1-1 Nishi-Shinjuku, Shinjuku-ku, Tokyo",
  "pageNumber": 1
}

Example 3 (low confidence pass):
{
  "result": "pass",
  "confidence": 0.65,
  "explanation": "The contract mentions payment terms, but the specific payment date is ambiguous. However, it meets the minimum requirements.",
  "shortExplanation": "Pass as payment terms exist though payment date is ambiguous",
  "extractedText": "Payment shall be made promptly after contract conclusion.",
  "pageNumber": 3
}

REMEMBER: YOUR ENTIRE RESPONSE INCLUDING ALL JSON FIELD VALUES MUST BE IN ${languageName}.
`;
};

/**
 * Review item processing parameters
 */
interface ProcessReviewItemParams {
  reviewJobId: string;
  checkId: string;
  reviewResultId: string;
  userId?: string; // Optional user ID for language preference
}

/**
 * Process a review item
 * @param params Processing parameters
 * @returns Processing result
 */
export async function processReviewItem(
  params: ProcessReviewItemParams
): Promise<any> {
  const { reviewJobId, checkId, reviewResultId, userId } = params;
  const reviewJobRepository = await makePrismaReviewJobRepository();

  // Get user preference for language if userId is provided
  let userLanguage = DEFAULT_LANGUAGE;
  if (userId) {
    try {
      console.log(
        `[DEBUG REVIEW] Attempting to get language preference for user ${userId}`
      );
      const userPreferenceRepository =
        await makePrismaUserPreferenceRepository();
      console.log(
        `[DEBUG REVIEW] Repository created, calling getUserPreference...`
      );
      const userPreference =
        await userPreferenceRepository.getUserPreference(userId);
      console.log(
        `[DEBUG REVIEW] User preference retrieved:`,
        JSON.stringify(userPreference, null, 2)
      );

      if (userPreference && userPreference.language) {
        userLanguage = userPreference.language;
        console.log(
          `[DEBUG REVIEW] Setting user language from preference: ${userLanguage}`
        );
      } else {
        console.log(
          `[DEBUG REVIEW] No language preference found in user data, using default: ${DEFAULT_LANGUAGE}`
        );
      }
    } catch (error) {
      console.error(
        `[DEBUG REVIEW] Failed to fetch user language preference:`,
        error
      );
      // Continue with default language
    }
  } else {
    console.log(
      `[DEBUG REVIEW] No userId provided, using default language: ${DEFAULT_LANGUAGE}`
    );
  }

  // Get document information related to the job
  const jobDetail = await reviewJobRepository.findReviewJobById({
    reviewJobId,
  });

  if (!jobDetail.documents || jobDetail.documents.length === 0) {
    throw new Error(`No documents found for review job ${reviewJobId}`);
  }

  // Branch processing based on document type
  // Group documents of the same type
  const imageDocuments = jobDetail.documents.filter(
    (doc) => doc.fileType === REVIEW_FILE_TYPE.IMAGE
  );
  const pdfDocuments = jobDetail.documents.filter(
    (doc) => doc.fileType === REVIEW_FILE_TYPE.PDF
  );

  // If there are image documents
  if (imageDocuments.length > 0) {
    console.log(
      `[DEBUG REVIEW] Processing image documents with userId: ${userId}`
    );
    return processImageReviewItem({
      reviewJobId: params.reviewJobId,
      documents: imageDocuments,
      checkId: params.checkId,
      reviewResultId: params.reviewResultId,
      userId: params.userId,
    });
    // If there are PDF documents
  } else if (pdfDocuments.length > 0) {
    console.log(
      `[DEBUG REVIEW] Processing PDF documents with userId: ${userId}`
    );
    return processPdfReviewItem({
      reviewJobId,
      documents: pdfDocuments,
      checkId,
      reviewResultId,
      userId,
    });
  } else {
    throw new Error(
      `No supported documents found for review job ${reviewJobId}`
    );
  }
}

import { createHash } from "crypto";

/**
 * Sanitize filename to meet Bedrock requirements
 * @param filename Filename to sanitize
 * @returns Sanitized filename
 */
function sanitizeFileNameForBedrock(filename: string): string {
  const parts = filename.split(".");
  const nameWithoutExtension = parts.join(".");

  // ファイル名のハッシュ値を計算
  const hash = createHash("md5")
    .update(nameWithoutExtension)
    .digest("hex")
    .substring(0, 8);

  const sanitized = `doc_${hash}`;
  console.log(
    `Sanitized filename for Bedrock: ${sanitized} (original: ${filename})`
  );
  return sanitized;
}

/**
 * Process a PDF review item
 * @param params Processing parameters
 * @returns Processing result
 */
async function processPdfReviewItem(params: {
  reviewJobId: string;
  documents: Array<{
    id: string;
    filename: string;
    s3Path: string;
    fileType: string;
  }>;
  checkId: string;
  reviewResultId: string;
  userId?: string; // Optional user ID for language preference
}): Promise<any> {
  const { reviewJobId, documents, checkId, reviewResultId, userId } = params;
  const reviewResultRepository = await makePrismaReviewResultRepository();
  const checkRepository = await makePrismaCheckRepository();

  // Get user preference for language if userId is provided
  let userLanguage = DEFAULT_LANGUAGE;
  if (userId) {
    try {
      console.log(
        `[DEBUG PDF] Attempting to get language preference for user ${userId}`
      );
      const userPreferenceRepository =
        await makePrismaUserPreferenceRepository();
      console.log(
        `[DEBUG PDF] Repository created, calling getUserPreference...`
      );
      const userPreference =
        await userPreferenceRepository.getUserPreference(userId);
      console.log(
        `[DEBUG PDF] User preference retrieved:`,
        JSON.stringify(userPreference, null, 2)
      );

      if (userPreference && userPreference.language) {
        userLanguage = userPreference.language;
        console.log(
          `[DEBUG PDF] Setting user language from preference: ${userLanguage}`
        );
      } else {
        console.log(
          `[DEBUG PDF] No language preference found in user data, using default: ${DEFAULT_LANGUAGE}`
        );
      }
    } catch (error) {
      console.error(
        `[DEBUG PDF] Failed to fetch user language preference:`,
        error
      );
      // Continue with default language
    }
  } else {
    console.log(
      `[DEBUG PDF] No userId provided, using default language: ${DEFAULT_LANGUAGE}`
    );
  }

  try {
    // Get checklist item
    const checkList = await checkRepository.findCheckListItemById(checkId);

    if (!checkList) {
      throw new Error(`Check list item not found: ${checkId}`);
    }

    // Get documents from S3
    const s3Client = new S3Client({});
    const bucketName = process.env.DOCUMENT_BUCKET || "";

    // Load multiple PDFs
    const pdfContents = await Promise.all(
      documents.map(async (document) => {
        const s3Key = document.s3Path;
        const { Body } = await s3Client.send(
          new GetObjectCommand({
            Bucket: bucketName,
            Key: s3Key,
          })
        );

        if (!Body) {
          throw new Error(`Document not found: ${s3Key}`);
        }

        // ファイル拡張子を取得
        const fileExtension = document.filename.split(".").pop()?.toLowerCase();

        // PDFのみサポート
        if (fileExtension !== "pdf") {
          throw new Error(
            `Unsupported file format: ${fileExtension}. Only PDF is supported.`
          );
        }

        // ドキュメントをバイト配列として取得
        const documentBytes = await Body.transformToByteArray();
        return {
          documentId: document.id,
          filename: document.filename,
          bytes: documentBytes,
        };
      })
    );

    // Prepare prompt based on user language
    console.log(
      `[DEBUG PDF] Processing review item ${reviewResultId} for check ${checkId} with userId: ${userId}, user language: ${userLanguage}`
    );
    const reviewPrompt = getReviewPrompt(userLanguage);
    const prompt = reviewPrompt
      .replace("{checkName}", checkList.name)
      .replace(
        "{checkDescription}",
        checkList.description ||
          (userLanguage === "ja" ? "説明なし" : "No description")
      );

    // Use Bedrock for review
    const bedrockClient = new BedrockRuntimeClient({
      region: BEDROCK_REGION,
    });

    // Add multiple PDFs as content
    const pdfContentsForBedrock = pdfContents.map((pdf) => ({
      document: {
        name: sanitizeFileNameForBedrock(pdf.filename),
        format: "pdf",
        source: {
          bytes: pdf.bytes,
        },
      },
    }));

    const response = await bedrockClient.send(
      new ConverseCommand({
        modelId: MODEL_ID,
        messages: [
          {
            role: "user",
            content: [
              { text: prompt },
              ...pdfContentsForBedrock.map((content) => content as any),
            ],
          },
        ],
      })
    );

    // Extract text from response
    let llmResponse = "";
    if (response.output?.message?.content) {
      response.output.message.content.forEach((block) => {
        if ("text" in block) {
          llmResponse += block.text;
        }
      });
    }

    // Log cache metrics
    const usage = response.usage as TokenUsage;
    const cacheReadTokens = usage?.cacheReadInputTokens || 0;
    const cacheWriteTokens = usage?.cacheWriteInputTokens || 0;
    const inputTokens = usage?.inputTokens || 0;
    const latencyMs = response.metrics?.latencyMs || 0;

    let cacheStatus = "unused";
    if (cacheReadTokens > 0) {
      cacheStatus = "hit";
    } else if (cacheWriteTokens > 0) {
      cacheStatus = "created";
    }

    console.log(
      `[Prompt Cache] Status: ${cacheStatus}, Read: ${cacheReadTokens}, Write: ${cacheWriteTokens}, Input: ${inputTokens}, Latency: ${latencyMs}ms, Check item ID: ${checkId}`
    );

    // Extract JSON response
    const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
    let reviewData;

    if (jsonMatch) {
      try {
        reviewData = JSON.parse(jsonMatch[0]);
      } catch (error) {
        // If JSON parsing fails, retry
        console.error("JSON parsing failed. Retrying...");

        // Retry prompt
        const retryPrompt = `
${prompt}

The previous response could not be parsed as JSON. Please return only a valid JSON object.
Do not use markdown syntax (like \`\`\`json), return only pure JSON.
`;

        // Add multiple PDFs as content for retry as well
        const retryResponse = await bedrockClient.send(
          new ConverseCommand({
            modelId: MODEL_ID,
            messages: [
              {
                role: "user",
                content: [
                  { text: retryPrompt },
                  ...pdfContentsForBedrock.map((content) => content as any),
                ],
              },
            ],
          })
        );

        // Extract text from retry response
        let retryLlmResponse = "";
        if (retryResponse.output?.message?.content) {
          retryResponse.output.message.content.forEach((block) => {
            if ("text" in block) {
              retryLlmResponse += block.text;
            }
          });
        }

        // Log cache metrics for retry
        const retryUsage = retryResponse.usage as TokenUsage;
        const retryCacheReadTokens = retryUsage?.cacheReadInputTokens || 0;
        const retryCacheWriteTokens = retryUsage?.cacheWriteInputTokens || 0;
        const retryInputTokens = retryUsage?.inputTokens || 0;
        const retryLatencyMs = retryResponse.metrics?.latencyMs || 0;

        let retryCacheStatus = "unused";
        if (retryCacheReadTokens > 0) {
          retryCacheStatus = "hit";
        } else if (retryCacheWriteTokens > 0) {
          retryCacheStatus = "created";
        }

        console.log(
          `[Prompt Cache (Retry)] Status: ${retryCacheStatus}, Read: ${retryCacheReadTokens}, Write: ${retryCacheWriteTokens}, Input: ${retryInputTokens}, Latency: ${retryLatencyMs}ms, Check item ID: ${checkId}`
        );

        const retryJsonMatch = retryLlmResponse.match(/\{[\s\S]*\}/);
        if (!retryJsonMatch) {
          throw new Error("Failed to extract JSON response even after retry.");
        }

        reviewData = JSON.parse(retryJsonMatch[0]);
      }
    } else {
      throw new Error("Failed to extract JSON response.");
    }

    // Update review results
    const current = await reviewResultRepository.findDetailedReviewResultById({
      resultId: reviewResultId,
    });
    const updated = ReviewResultDomain.fromLlmReviewData({
      current,
      result: reviewData.result,
      confidenceScore: reviewData.confidence,
      explanation: reviewData.explanation,
      shortExplanation: reviewData.shortExplanation,
      extractedText: reviewData.extractedText,
      sourceReferences: pdfContents.map((pdf) => ({
        documentId: pdf.documentId,
        pageNumber: reviewData.pageNumber,
      })),
    });
    await reviewResultRepository.updateResult({
      newResult: updated,
    });

    return {
      status: "success",
      reviewResultId,
      checkId,
      result: reviewData.result,
    };
  } catch (error) {
    console.error(`Error processing review item ${reviewResultId}:`, error);
    throw error;
  }
}
