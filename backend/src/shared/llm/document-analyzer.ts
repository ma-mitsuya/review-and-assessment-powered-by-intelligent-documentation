/**
 * Document analyzer service for analyzing documents against checklists
 */
import { LlmMessage, LlmServiceError, Result, err, ok } from "./types";
import { sendRequest } from "./llm-service";
import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import { createBedrockClient } from "./llm-client";

/**
 * Document analysis result
 */
export interface DocumentAnalysisResult {
  compliantItems: string[];
  nonCompliantItems: string[];
  uncertainItems: string[];
  reasoning: string;
  summary: string;
}

/**
 * Analyze a document against a checklist
 * @param documentContent Document content to analyze
 * @param checklistItems Checklist items to check against
 * @param client Optional BedrockRuntimeClient for testing
 * @returns Analysis result or error
 */
export async function analyzeDocument(
  documentContent: string,
  checklistItems: string[],
  client: BedrockRuntimeClient = createBedrockClient()
): Promise<Result<DocumentAnalysisResult, LlmServiceError>> {
  if (!documentContent || documentContent.trim() === '') {
    return err({ type: 'INVALID_INPUT', message: 'Document content cannot be empty' });
  }

  if (!checklistItems || checklistItems.length === 0) {
    return err({ type: 'INVALID_INPUT', message: 'Checklist items cannot be empty' });
  }

  const formattedChecklist = checklistItems.map((item, index) => `${index + 1}. ${item}`).join('\n');
  
  const systemPrompt: LlmMessage = {
    role: 'system',
    content: `You are an expert document compliance analyzer for the real estate industry. 
Your task is to analyze a document against a checklist of requirements and determine if each item is compliant, non-compliant, or if there's not enough information to determine compliance.

For each checklist item, you must:
1. Determine if the document is compliant with the requirement
2. Provide specific evidence from the document that supports your determination
3. If you cannot determine compliance with high confidence, mark it as uncertain

Format your response as a JSON object with the following structure:
{
  "compliantItems": ["item1", "item2", ...],
  "nonCompliantItems": ["item3", "item4", ...],
  "uncertainItems": ["item5", "item6", ...],
  "reasoning": "Detailed explanation of your analysis for each item",
  "summary": "Brief summary of overall compliance status"
}

Be thorough and precise in your analysis. Only mark an item as compliant if there is clear evidence in the document.`
  };

  const userPrompt: LlmMessage = {
    role: 'user',
    content: `Please analyze the following document against the checklist items:

DOCUMENT:
${documentContent}

CHECKLIST ITEMS:
${formattedChecklist}

Provide your analysis in the JSON format specified.`
  };

  const result = await sendRequest([systemPrompt, userPrompt], {}, client);

  if (!result.ok) {
    return err(result.error);
  }

  try {
    // Extract JSON from the response
    const responseText = result.value.content;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      return err({ 
        type: 'UNKNOWN_ERROR', 
        message: 'Failed to parse JSON response from LLM' 
      });
    }
    
    const analysisResult = JSON.parse(jsonMatch[0]) as DocumentAnalysisResult;
    
    return ok(analysisResult);
  } catch (error) {
    return err({ 
      type: 'UNKNOWN_ERROR', 
      message: 'Failed to parse analysis result',
      originalError: error 
    });
  }
}
