/**
 * Tests for LLM Core functions
 */
import { 
  ConversationRole,
  ValidationException,
  ServiceUnavailableException,
  ThrottlingException
} from "@aws-sdk/client-bedrock-runtime";
import { mapRole, formatMessages, handleError } from '../llm-core';
import { LlmMessage } from '../types';

describe('LLM Core', () => {
  describe('mapRole', () => {
    it('should map user role correctly', () => {
      expect(mapRole('user')).toBe(ConversationRole.USER);
    });

    it('should map assistant role correctly', () => {
      expect(mapRole('assistant')).toBe(ConversationRole.ASSISTANT);
    });

    it('should map system role to USER', () => {
      // System role is not supported in Converse API, so it's mapped to USER
      expect(mapRole('system')).toBe(ConversationRole.USER);
    });
  });

  describe('formatMessages', () => {
    it('should format messages correctly', () => {
      const messages: LlmMessage[] = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there' },
        { role: 'system', content: 'Be helpful' }
      ];

      const formatted = formatMessages(messages);
      
      expect(formatted).toEqual([
        { role: ConversationRole.USER, content: [{ text: 'Hello' }] },
        { role: ConversationRole.ASSISTANT, content: [{ text: 'Hi there' }] },
        { role: ConversationRole.USER, content: [{ text: 'Be helpful' }] }
      ]);
    });
  });

  describe('handleError', () => {
    it('should handle ValidationException', () => {
      const error = new ValidationException({ message: 'Invalid request', $metadata: {} });
      const result = handleError(error);
      
      expect(result).toEqual({
        type: 'INVALID_INPUT',
        message: 'Invalid request'
      });
    });

    it('should handle ServiceUnavailableException', () => {
      const error = new ServiceUnavailableException({ message: 'Service unavailable', $metadata: {} });
      const result = handleError(error);
      
      expect(result).toEqual({
        type: 'SERVICE_UNAVAILABLE',
        message: 'Service unavailable'
      });
    });

    it('should handle ThrottlingException', () => {
      const error = new ThrottlingException({ message: 'Rate limit exceeded', $metadata: {} });
      const result = handleError(error);
      
      expect(result).toEqual({
        type: 'RATE_LIMIT_EXCEEDED',
        message: 'Rate limit exceeded'
      });
    });

    it('should handle unknown errors', () => {
      const error = new Error('Unknown error');
      const result = handleError(error);
      
      expect(result).toEqual({
        type: 'UNKNOWN_ERROR',
        message: 'Unknown error',
        originalError: error
      });
    });

    it('should handle non-Error objects', () => {
      const error = 'String error';
      const result = handleError(error);
      
      expect(result).toEqual({
        type: 'UNKNOWN_ERROR',
        message: 'Unknown error occurred',
        originalError: error
      });
    });
  });
});
