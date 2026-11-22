/**
 * chatSanitization.ts
 * 
 * Ensures the concierge persona remains polished and brand-aligned across all user sessions.
 * Automatically purges legacy debug artifacts, robotic strings, or obsolete storage keys
 * left over from early development stages.
 */

export const FORBIDDEN_CHAT_PATTERNS = [
  /\[ai\b/i,
  /\bsystem prompt\b/i,
  /\bstage 1\b/i,
  /\bstage 2\b/i,
  /\bstage 3\b/i,
  /\brobot\b/i,
  /\bdebug\b/i,
  /\blarge language model\b/i,
  /\bas an ai\b/i,
  /\bكنموذج لغوي\b/i,
  /\bنظام ذكاء اصطناعي\b/i,
  /\bالمساعد الآلي\b/i,
];

export const LEGACY_CHAT_STORAGE_KEYS = [
  'daleel_ai_chat_v1',
  'rihal_ai_chat',
  'support_chat_history',
  'rihal_support_chat_v1',
  'rihal_concierge_debug_logs',
];

export interface ChatMessageLike {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp?: string;
  [key: string]: unknown;
}

/**
 * Checks whether a message contains forbidden robotic/system debug strings.
 */
export function containsLegacyChatArtifact(text: string): boolean {
  if (!text) return false;
  return FORBIDDEN_CHAT_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Sanitizes an array of chat messages, stripping any message that contains robotic/system debug strings.
 */
export function sanitizeChatMessages<T extends ChatMessageLike>(messages: T[]): T[] {
  if (!Array.isArray(messages)) return [];
  return messages.filter((msg) => !containsLegacyChatArtifact(msg.text));
}

/**
 * Purges obsolete legacy localStorage keys and sanitizes active chat session storage.
 * Safe to run in any browser or test environment.
 */
export function purgeLegacyChatArtifacts(activeStorageKey = 'rihal_support_chat_v2'): {
  purgedKeys: string[];
  sanitizedActiveKey: boolean;
  retainedCount: number;
} {
  const result = {
    purgedKeys: [] as string[],
    sanitizedActiveKey: false,
    retainedCount: 0,
  };

  if (typeof window === 'undefined' || !window.localStorage) {
    return result;
  }

  // 1. Purge known deprecated legacy storage keys
  for (const legacyKey of LEGACY_CHAT_STORAGE_KEYS) {
    if (localStorage.getItem(legacyKey) !== null) {
      localStorage.removeItem(legacyKey);
      result.purgedKeys.push(legacyKey);
    }
  }

  // 2. Sanitize the active chat storage key if present
  try {
    const raw = localStorage.getItem(activeStorageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const sanitized = sanitizeChatMessages(parsed);
        result.retainedCount = sanitized.length;
        if (sanitized.length !== parsed.length) {
          result.sanitizedActiveKey = true;
          localStorage.setItem(activeStorageKey, JSON.stringify(sanitized.slice(-5)));
        }
      }
    }
  } catch {
    // If corrupt, safely remove active key to allow clean start
    localStorage.removeItem(activeStorageKey);
    result.sanitizedActiveKey = true;
  }

  return result;
}
