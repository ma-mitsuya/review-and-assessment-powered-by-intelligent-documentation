/**
 * Unit Tests for LLM Invoke Service
 */
import { 
  BedrockRuntimeClient, 
  ConverseCommand
} from "@aws-sdk/client-bedrock-runtime";
import { LlmMessage } from '../llm-types';
import { sendRequest } from '../operations/llm-invoke';

// Mock AWS SDK
jest.mock('@aws-sdk/client-bedrock-runtime');

describe('LLM Invoke Service - Unit Tests', () => {
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

  describe('sendRequest', () => {
    it('should handle successful responses', async () => {
      // Mock successful response
      mockSend.mockResolvedValue({
        output: {
          message: {
            content: [
              { text: 'This is a test response' }
            ]
          }
        },
        usage: {
          inputTokens: 10,
          outputTokens: 5,
          totalTokens: 15
        }
      });

      const messages: LlmMessage[] = [
        { role: 'user', content: 'Hello, world!' }
      ];

      const result = await sendRequest(messages, {}, mockClient);

      // Verify result
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.content).toBe('This is a test response');
        expect(result.value.usage.inputTokens).toBe(10);
        expect(result.value.usage.outputTokens).toBe(5);
        expect(result.value.usage.totalTokens).toBe(15);
      }
      
      // Verify command was sent correctly
      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend.mock.calls[0][0]).toBeInstanceOf(ConverseCommand);
    });

    it('should handle API errors', async () => {
      // Mock API error
      const apiError = new Error('API Error');
      mockSend.mockRejectedValue(apiError);

      const messages: LlmMessage[] = [
        { role: 'user', content: 'Hello, world!' }
      ];

      const result = await sendRequest(messages, {}, mockClient);

      // Verify result
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('UNKNOWN_ERROR');
        expect(result.error.message).toBe('API Error');
      }
    });

    it('should handle missing response content', async () => {
      // Mock response with missing content
      mockSend.mockResolvedValue({
        output: {
          message: {}
        }
      });

      const messages: LlmMessage[] = [
        { role: 'user', content: 'Hello, world!' }
      ];

      const result = await sendRequest(messages, {}, mockClient);

      // Verify result
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.content).toBe('');
        expect(result.value.usage.inputTokens).toBe(0);
        expect(result.value.usage.outputTokens).toBe(0);
        expect(result.value.usage.totalTokens).toBe(0);
      }
    });
  });
});
