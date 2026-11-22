import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  containsLegacyChatArtifact,
  sanitizeChatMessages,
  purgeLegacyChatArtifacts,
  FORBIDDEN_CHAT_PATTERNS,
} from '../chatSanitization';

describe('chatSanitization utility', () => {
  it('detects robotic phrases and debug artifacts', () => {
    assert.strictEqual(containsLegacyChatArtifact('System prompt initialized: Stage 1 test'), true);
    assert.strictEqual(containsLegacyChatArtifact('As an AI language model, I cannot do that'), true);
    assert.strictEqual(containsLegacyChatArtifact('Welcome to Nile Jewels! Faris here to assist with your Luxor tour.'), false);
    assert.strictEqual(containsLegacyChatArtifact('أهلاً بك! معك زميلك فارس من فريق العمليات.'), false);
  });

  it('sanitizes message arrays by removing robotic entries', () => {
    const raw = [
      { id: '1', sender: 'assistant' as const, text: 'Hello, I am a robot AI system.' },
      { id: '2', sender: 'assistant' as const, text: 'Welcome to RIHAL. How can I assist your operations manifest today?' },
    ];
    const sanitized = sanitizeChatMessages(raw);
    assert.strictEqual(sanitized.length, 1);
    assert.strictEqual(sanitized[0].id, '2');
  });

  it('runs purgeLegacyChatArtifacts gracefully without throwing', () => {
    const result = purgeLegacyChatArtifacts('test_key');
    assert.strictEqual(typeof result, 'object');
    assert.ok(Array.isArray(result.purgedKeys));
  });
});
