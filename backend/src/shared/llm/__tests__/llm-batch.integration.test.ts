/**
 * Integration Tests for LLM Batch Service
 * 
 * These tests call the actual AWS Bedrock API.
 * To run these tests, set the environment variable RUN_INTEGRATION_TESTS=true
 */
import { sendBatchRequest, processPagesInBatch } from '../operations/llm-batch';

// Skip integration tests unless explicitly enabled
const runIntegrationTests = process.env.RUN_INTEGRATION_TESTS === 'true';

(runIntegrationTests ? describe : describe.skip)('LLM Batch Service - Integration Tests', () => {
  // Set longer timeout for API calls
  jest.setTimeout(30000);

  describe('sendBatchRequest', () => {
    it('should process multiple requests and return valid responses', async () => {
      const batchRequests = [
        {
          id: 'test-1',
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: '日本語で東京の天気を教えて' }
          ]
        },
        {
          id: 'test-2',
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: 'What is the capital of France?' }
          ]
        }
      ];

      const result = await sendBatchRequest(batchRequests);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBe(2);
        
        // Find responses by ID
        const response1 = result.value.find(r => r.id === 'test-1');
        const response2 = result.value.find(r => r.id === 'test-2');
        
        // Check responses exist
        expect(response1).toBeDefined();
        expect(response2).toBeDefined();
        
        if (response1 && response2) {
          // Check first response (Japanese weather)
          expect(response1.success).toBe(true);
          expect(response1.content).toBeTruthy();
          expect(response1.usage).toBeDefined();
          
          // Check second response (capital of France)
          expect(response2.success).toBe(true);
          expect(response2.content.toLowerCase()).toContain('paris');
          expect(response2.usage).toBeDefined();
        }
      }
    });

    it('should handle errors gracefully', async () => {
      // Invalid request that should cause an error
      const batchRequests = [
        {
          id: 'test-error',
          messages: [
            { role: 'invalid-role' as any, content: 'This should cause an error' }
          ]
        }
      ];

      const result = await sendBatchRequest(batchRequests);
      
      // The overall request should still succeed
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBe(1);
        expect(result.value[0].id).toBe('test-error');
        expect(result.value[0].success).toBe(false);
        expect(result.value[0].error).toBeDefined();
      }
    });
  });

  describe('processPagesInBatch', () => {
    it('should process multiple pages', async () => {
      const pages = [
        {
          id: 'page-1',
          messages: [
            { role: 'system', content: 'You are a document processor.' },
            { role: 'user', content: 'Summarize this text: 東京は日本の首都です。' }
          ]
        },
        {
          id: 'page-2',
          messages: [
            { role: 'system', content: 'You are a document processor.' },
            { role: 'user', content: 'Summarize this text: Paris is the capital of France.' }
          ]
        }
      ];

      const result = await processPagesInBatch(pages);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBe(2);
        
        // Find responses by ID
        const page1Response = result.value.find(r => r.id === 'page-1');
        const page2Response = result.value.find(r => r.id === 'page-2');
        
        // Check responses exist
        expect(page1Response).toBeDefined();
        expect(page2Response).toBeDefined();
        
        if (page1Response && page2Response) {
          expect(page1Response.success).toBe(true);
          expect(page1Response.content).toContain('東京');
          
          expect(page2Response.success).toBe(true);
          expect(page2Response.content.toLowerCase()).toContain('paris');
        }
      }
    });
  });
});
