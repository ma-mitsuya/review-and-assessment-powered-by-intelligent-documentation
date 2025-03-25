/**
 * Integration Tests for LLM Invoke Service
 * 
 * These tests call the actual AWS Bedrock API.
 * To run these tests, set the environment variable RUN_INTEGRATION_TESTS=true
 */
import { sendRequest } from '../operations/llm-invoke';

// Skip integration tests unless explicitly enabled
const runIntegrationTests = process.env.RUN_INTEGRATION_TESTS === 'true';

(runIntegrationTests ? describe : describe.skip)('LLM Invoke Service - Integration Tests', () => {
  // Set longer timeout for API calls
  jest.setTimeout(30000);

  describe('sendRequest', () => {
    it('should process a request and return a valid response', async () => {
      const messages = [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: '日本語で東京の天気を教えて' }
      ];

      const result = await sendRequest(messages);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.content).toBeTruthy();
        expect(result.value.content.length).toBeGreaterThan(10);
        expect(result.value.content).toContain('東京');
        
        // Check usage metrics
        expect(result.value.usage).toBeDefined();
        expect(result.value.usage.inputTokens).toBeGreaterThan(0);
        expect(result.value.usage.outputTokens).toBeGreaterThan(0);
        expect(result.value.usage.totalTokens).toBeGreaterThan(0);
      }
    });

    it('should handle complex prompts', async () => {
      const messages = [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Explain quantum computing in simple terms' },
        { role: 'assistant', content: 'Quantum computing uses quantum bits or qubits that can be both 0 and 1 at the same time, unlike classical bits.' },
        { role: 'user', content: 'Can you give me a simple analogy?' }
      ];

      const result = await sendRequest(messages);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.content).toBeTruthy();
        expect(result.value.content.length).toBeGreaterThan(50);
        
        // The response should be an analogy about quantum computing
        expect(result.value.content.toLowerCase()).toMatch(/quantum|analogy|like|imagine/);
      }
    });

    it('should handle errors gracefully', async () => {
      // Invalid request that should cause an error
      const messages = [
        { role: 'invalid-role' as any, content: 'This should cause an error' }
      ];

      const result = await sendRequest(messages);
      
      // The request should fail
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeDefined();
        expect(result.error.type).toBeDefined();
        expect(result.error.message).toBeDefined();
      }
    });
  });
});
