/**
 * Unit Tests for LLM Batch Service
 */
import { 
  BedrockRuntimeClient, 
  InvokeModelCommand
} from "@aws-sdk/client-bedrock-runtime";
import { LlmMessage, LlmBatchRequest, LlmBatchErrorResponse } from '../llm-types';
import { sendBatchRequest, processPagesInBatch } from '../operations/llm-batch';

// Mock AWS SDK
jest.mock('@aws-sdk/client-bedrock-runtime');

describe('LLM Batch Service - Unit Tests', () => {
  let mockSend: jest.Mock;
  let mockClient: jest.Mocked<BedrockRuntimeClient>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock implementation
    mockSend = jest.fn();
    mockClient = {
      send: mockSend
    } as unknown as jest.Mocked<BedrockRuntimeClient>;
    
    (BedrockRuntimeClient as jest.Mock).mockImplementation(() => mockClient);
  });

  describe('sendBatchRequest', () => {
    it('should reject empty batch requests', async () => {
      const result = await sendBatchRequest([], {}, mockClient);
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('INVALID_INPUT');
        expect(result.error.message).toContain('cannot be empty');
      }
      
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should handle parsing errors in responses', async () => {
      // Mock invalid JSON response
      mockSend.mockResolvedValue({
        body: Buffer.from('Invalid JSON')
      });

      const batchRequests: LlmBatchRequest[] = [
        {
          id: 'page-1',
          messages: [{ role: 'user', content: 'Process page 1' }]
        }
      ];

      const result = await sendBatchRequest(batchRequests, {}, mockClient);

      // Verify result
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBe(1);
        expect(result.value[0].id).toBe('page-1');
        expect(result.value[0].success).toBe(false);
        
        // Type assertion to access error property
        const errorResponse = result.value[0] as LlmBatchErrorResponse;
        expect(errorResponse.error.type).toBe('UNKNOWN_ERROR');
      }
    });

    it('should handle overall service errors', async () => {
      // Mock overall service error
      const error = new Error('Service unavailable');
      
      // Override Promise.all to simulate a failure at the batch level
      const originalPromiseAll = Promise.all;
      Promise.all = jest.fn().mockRejectedValue(error);

      const batchRequests: LlmBatchRequest[] = [
        {
          id: 'page-1',
          messages: [{ role: 'user', content: 'Process page 1' }]
        }
      ];

      const result = await sendBatchRequest(batchRequests, {}, mockClient);

      // Restore Promise.all
      Promise.all = originalPromiseAll;

      // Verify result
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('UNKNOWN_ERROR');
        expect(result.error.message).toBe('Service unavailable');
      }
    });
  });
});
