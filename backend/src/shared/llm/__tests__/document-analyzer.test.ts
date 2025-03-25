/**
 * Tests for Document Analyzer
 */
import { analyzeDocument, DocumentAnalysisResult } from '../document-analyzer';
import * as llmService from '../llm-service';
import { ok, err } from '../types';
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';

// Mock LLM service
jest.mock('../llm-service');

describe('Document Analyzer', () => {
  const mockClient = {} as BedrockRuntimeClient;
  
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should reject empty document content', async () => {
    const result = await analyzeDocument('', ['Item 1'], mockClient);
    
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe('INVALID_INPUT');
      expect(result.error.message).toContain('Document content cannot be empty');
    }
  });

  it('should reject empty checklist items', async () => {
    const result = await analyzeDocument('Document content', [], mockClient);
    
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe('INVALID_INPUT');
      expect(result.error.message).toContain('Checklist items cannot be empty');
    }
  });

  it('should handle LLM service errors', async () => {
    jest.spyOn(llmService, 'sendRequest').mockResolvedValue(
      err({ type: 'SERVICE_UNAVAILABLE', message: 'Service unavailable' })
    );

    const result = await analyzeDocument('Document content', ['Item 1'], mockClient);
    
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe('SERVICE_UNAVAILABLE');
      expect(result.error.message).toBe('Service unavailable');
    }
  });

  it('should handle invalid JSON response', async () => {
    jest.spyOn(llmService, 'sendRequest').mockResolvedValue(
      ok({
        content: 'This is not a valid JSON response',
        usage: {
          inputTokens: 100,
          outputTokens: 50,
          totalTokens: 150
        }
      })
    );

    const result = await analyzeDocument('Document content', ['Item 1'], mockClient);
    
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe('UNKNOWN_ERROR');
      expect(result.error.message).toContain('Failed to parse');
    }
  });

  it('should successfully analyze a document', async () => {
    const mockAnalysisResult: DocumentAnalysisResult = {
      compliantItems: ['Item 1'],
      nonCompliantItems: ['Item 2'],
      uncertainItems: ['Item 3'],
      reasoning: 'Detailed reasoning',
      summary: 'Summary of analysis'
    };

    jest.spyOn(llmService, 'sendRequest').mockResolvedValue(
      ok({
        content: JSON.stringify(mockAnalysisResult),
        usage: {
          inputTokens: 100,
          outputTokens: 50,
          totalTokens: 150
        }
      })
    );

    const result = await analyzeDocument('Document content', ['Item 1', 'Item 2', 'Item 3'], mockClient);
    
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual(mockAnalysisResult);
    }

    // Verify that the LLM service was called with the correct messages
    expect(llmService.sendRequest).toHaveBeenCalledTimes(1);
    const callArgs = (llmService.sendRequest as jest.Mock).mock.calls[0][0];
    
    // Check system prompt
    expect(callArgs[0].role).toBe('system');
    expect(callArgs[0].content).toContain('expert document compliance analyzer');
    
    // Check user prompt
    expect(callArgs[1].role).toBe('user');
    expect(callArgs[1].content).toContain('Document content');
    expect(callArgs[1].content).toContain('1. Item 1');
    expect(callArgs[1].content).toContain('2. Item 2');
    expect(callArgs[1].content).toContain('3. Item 3');
  });

  it('should extract JSON from a response with surrounding text', async () => {
    const mockAnalysisResult: DocumentAnalysisResult = {
      compliantItems: ['Item 1'],
      nonCompliantItems: ['Item 2'],
      uncertainItems: [],
      reasoning: 'Detailed reasoning',
      summary: 'Summary of analysis'
    };

    jest.spyOn(llmService, 'sendRequest').mockResolvedValue(
      ok({
        content: `Here's my analysis:
        
        {
          "compliantItems": ["Item 1"],
          "nonCompliantItems": ["Item 2"],
          "uncertainItems": [],
          "reasoning": "Detailed reasoning",
          "summary": "Summary of analysis"
        }
        
        I hope this helps!`,
        usage: {
          inputTokens: 100,
          outputTokens: 50,
          totalTokens: 150
        }
      })
    );

    const result = await analyzeDocument('Document content', ['Item 1', 'Item 2'], mockClient);
    
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual(mockAnalysisResult);
    }
  });
});
