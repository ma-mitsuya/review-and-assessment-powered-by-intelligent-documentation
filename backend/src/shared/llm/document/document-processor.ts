/**
 * Document processor service for processing documents
 */
import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import { createBedrockClient } from "../llm-client";
import { processPagesInBatch } from "../operations/llm-batch";
import { LlmMessage, Result, err, ok } from "../llm-types";

/**
 * Process a document page with multimodal LLM
 * @param imageBuffer Image buffer of the page
 * @param pageNumber Page number
 * @param client Optional BedrockRuntimeClient for testing
 * @returns Result with processed markdown content
 */
export async function processPageWithMultimodalLLM(
  imageBuffer: Buffer,
  pageNumber: number,
  client: BedrockRuntimeClient = createBedrockClient()
): Promise<Result<string>> {
  try {
    // Base64エンコード
    const base64Image = imageBuffer.toString('base64');
    
    // プロンプト作成
    const messages: LlmMessage[] = [
      {
        role: 'system',
        content: `You are a document processing assistant. Your task is to extract and structure information from document images.
Extract all text content from the image and format it as clean, structured Markdown.
Preserve the original document structure as much as possible, including:
- Headings (use Markdown heading levels)
- Lists (use Markdown bullet or numbered lists)
- Tables (use Markdown tables)
- Paragraphs (with proper spacing)
- Important formatting (bold, italics for emphasized text)

If there are any diagrams, charts, or non-text elements, briefly describe them in [brackets].
If any text is unclear or unreadable, indicate this with [unreadable text].`
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `This is page ${pageNumber} of a document. Please extract and structure all the text content from this image as clean Markdown.`
          },
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: base64Image
            }
          }
        ]
      }
    ];
    
    // 単一ページ処理
    const batchResult = await processPagesInBatch(
      [{ id: `page-${pageNumber}`, messages }],
      {},
      client
    );
    
    if (!batchResult.ok) {
      return err(batchResult.error);
    }
    
    const pageResult = batchResult.value[0];
    
    if (!pageResult.success) {
      return err(pageResult.error);
    }
    
    return ok(pageResult.content);
  } catch (error) {
    return err({
      type: 'UNKNOWN_ERROR',
      message: `Failed to process page ${pageNumber}`,
      originalError: error instanceof Error ? error : new Error(String(error))
    });
  }
}
