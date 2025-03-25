/**
 * Tests for LLM Service functions
 */
import { 
  BedrockRuntimeClient, 
  ConverseCommand,
  ConverseStreamCommand,
  ValidationException,
  ServiceUnavailableException,
  ThrottlingException
} from "@aws-sdk/client-bedrock-runtime";
import { LlmMessage } from '../types';
import { sendRequest, sendStreamingRequest } from '../llm-service';

// Mock AWS SDK
jest.mock('@aws-sdk/client-bedrock-runtime');

describe('LLM Service', () => {
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
    it('should send a request to Bedrock using Converse API and return the response', async () => {
      // Mock successful response
      const mockResponse = {
        output: {
          message: {
            content: [{ text: 'This is a response' }]
          }
        },
        usage: {
          inputTokens: 100,
          outputTokens: 50,
          totalTokens: 150
        }
      };
      
      mockSend.mockResolvedValue(mockResponse);

      const messages: LlmMessage[] = [
        { role: 'user', content: 'Hello' }
      ];

      const result = await sendRequest(messages, {}, mockClient);

      // Verify result
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.content).toBe('This is a response');
        expect(result.value.usage.inputTokens).toBe(100);
        expect(result.value.usage.outputTokens).toBe(50);
        expect(result.value.usage.totalTokens).toBe(150);
      }

      // Verify that the client was called with ConverseCommand
      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(ConverseCommand).toHaveBeenCalledWith(expect.objectContaining({
        modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: expect.any(String),
            content: expect.arrayContaining([
              expect.objectContaining({ text: 'Hello' })
            ])
          })
        ]),
        inferenceConfig: expect.objectContaining({
          maxTokens: 4096,
          temperature: 0.2,
          topP: 0.9
        })
      }));
    });

    it('should handle validation errors', async () => {
      // Mock validation error
      const error = new ValidationException({ message: 'Invalid request', $metadata: {} });
      mockSend.mockRejectedValue(error);

      const messages: LlmMessage[] = [
        { role: 'user', content: 'Hello' }
      ];

      const result = await sendRequest(messages, {}, mockClient);

      // Verify result
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('INVALID_INPUT');
        // Don't test exact message as it may vary
      }
    });

    it('should handle service unavailable errors', async () => {
      // Mock service unavailable error
      const error = new ServiceUnavailableException({ message: 'Service unavailable', $metadata: {} });
      mockSend.mockRejectedValue(error);

      const messages: LlmMessage[] = [
        { role: 'user', content: 'Hello' }
      ];

      const result = await sendRequest(messages, {}, mockClient);

      // Verify result
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('SERVICE_UNAVAILABLE');
        // Don't test exact message as it may vary
      }
    });

    it('should handle throttling errors', async () => {
      // Mock throttling error
      const error = new ThrottlingException({ message: 'Rate limit exceeded', $metadata: {} });
      mockSend.mockRejectedValue(error);

      const messages: LlmMessage[] = [
        { role: 'user', content: 'Hello' }
      ];

      const result = await sendRequest(messages, {}, mockClient);

      // Verify result
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('RATE_LIMIT_EXCEEDED');
        // Don't test exact message as it may vary
      }
    });

    it('should handle unknown errors', async () => {
      // Mock unknown error
      mockSend.mockRejectedValue(new Error('Unknown error'));

      const messages: LlmMessage[] = [
        { role: 'user', content: 'Hello' }
      ];

      const result = await sendRequest(messages, {}, mockClient);

      // Verify result
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('UNKNOWN_ERROR');
        expect(result.error.message).toBe('Unknown error');
      }
    });
  });

  describe('sendStreamingRequest', () => {
    it('should handle streaming responses', async () => {
      // Create mock chunks
      const chunk1 = {
        contentBlockDelta: {
          delta: { text: 'Hello' }
        }
      };
      
      const chunk2 = {
        contentBlockDelta: {
          delta: { text: ' world' }
        }
      };
      
      const chunk3 = {
        messageStop: {}
      };
      
      // Create a mock async iterator
      const mockStream = {
        [Symbol.asyncIterator]: () => {
          const chunks = [chunk1, chunk2, chunk3];
          let index = 0;
          return {
            next: async () => {
              if (index < chunks.length) {
                return { value: chunks[index++], done: false };
              } else {
                return { done: true };
              }
            }
          };
        }
      };
      
      mockSend.mockResolvedValue({ stream: mockStream });

      const messages: LlmMessage[] = [
        { role: 'user', content: 'Hello' }
      ];

      const mockHandler = jest.fn();

      const result = await sendStreamingRequest(messages, mockHandler, {}, mockClient);

      // Verify result
      expect(result.ok).toBe(true);

      // Verify that the handler was called with the correct chunks
      expect(mockHandler).toHaveBeenCalledTimes(3);
      expect(mockHandler).toHaveBeenNthCalledWith(1, { content: 'Hello', isDone: false });
      expect(mockHandler).toHaveBeenNthCalledWith(2, { content: ' world', isDone: false });
      expect(mockHandler).toHaveBeenNthCalledWith(3, { content: '', isDone: true });

      // Verify that the client was called with ConverseStreamCommand
      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(ConverseStreamCommand).toHaveBeenCalledWith(expect.objectContaining({
        modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: expect.any(String),
            content: expect.arrayContaining([
              expect.objectContaining({ text: 'Hello' })
            ])
          })
        ]),
        inferenceConfig: expect.objectContaining({
          maxTokens: 4096,
          temperature: 0.2,
          topP: 0.9
        })
      }));
    });

    it('should handle errors in streaming', async () => {
      // Mock error
      const error = new ServiceUnavailableException({ message: 'Service unavailable', $metadata: {} });
      mockSend.mockRejectedValue(error);

      const messages: LlmMessage[] = [
        { role: 'user', content: 'Hello' }
      ];

      const mockHandler = jest.fn();

      const result = await sendStreamingRequest(messages, mockHandler, {}, mockClient);

      // Verify result
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('SERVICE_UNAVAILABLE');
        // Don't test exact message as it may vary
      }

      // Verify that the handler was not called
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should handle missing stream', async () => {
      // Mock response with no stream
      mockSend.mockResolvedValue({ stream: undefined });

      const messages: LlmMessage[] = [
        { role: 'user', content: 'Hello' }
      ];

      const mockHandler = jest.fn();

      const result = await sendStreamingRequest(messages, mockHandler, {}, mockClient);

      // Verify result
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('UNKNOWN_ERROR');
        expect(result.error.message).toBe('No stream returned from Bedrock');
      }

      // Verify that the handler was not called
      expect(mockHandler).not.toHaveBeenCalled();
    });
  });
});
