// Gemini configuration. Model fallback order is intentional:
// 2.5-flash is the primary, 2.5-flash-lite is the cheap fallback,
// 2.0-flash is the last-ditch backstop. Each model retries 3× with
// linear backoff on 503/429.

export const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
] as const;
export const GEMINI_MAX_ATTEMPTS_PER_MODEL = 3;
export const GEMINI_BACKOFF_MS = 400;
export const GEMINI_TEMPERATURE = 0.6;
export const GEMINI_MAX_OUTPUT_TOKENS = 2048;
export const GEMINI_THINKING_BUDGET = 0;
export const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
