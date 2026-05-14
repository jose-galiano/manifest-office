// Gemini API wrapper. Tries the configured model sequence in order, with
// up to N retries per model (linear backoff on 503/429). Returns the first
// successful response or surfaces the last error.

import {
  GEMINI_API_BASE,
  GEMINI_BACKOFF_MS,
  GEMINI_MAX_ATTEMPTS_PER_MODEL,
  GEMINI_MAX_OUTPUT_TOKENS,
  GEMINI_MODELS,
  GEMINI_TEMPERATURE,
  GEMINI_THINKING_BUDGET,
} from '@/lib/constants/gemini';
import { getEnv } from '@/lib/utils/env';

type GeminiPart = { text: string };
type GeminiContent = { role: 'user' | 'model'; parts: GeminiPart[] };

type GeminiCandidate = {
  content: { parts: GeminiPart[] } | null;
};

export type GeminiResponse = {
  candidates: GeminiCandidate[] | null;
};

export type GeminiCallSuccess = {
  ok: true;
  data: GeminiResponse;
  model: string;
};

export type GeminiCallFailure = {
  ok: false;
  error: {
    status?: number;
    message?: string;
    data?: unknown;
  } | null;
};

export type GeminiCallResult = GeminiCallSuccess | GeminiCallFailure;

export type CallGeminiInput = {
  systemPrompt: string;
  userMessage: string;
};

export async function callGemini(input: CallGeminiInput): Promise<GeminiCallResult> {
  const apiKey = getEnv('GOOGLE_AI_API_KEY');
  const body = JSON.stringify(buildRequestBody(input));

  let lastError: GeminiCallFailure['error'] = null;

  for (const model of GEMINI_MODELS) {
    const attempt = await runModelAttempts({ apiKey, body, model });
    if (attempt.ok) {
      return attempt;
    }
    lastError = attempt.error;
  }

  return { ok: false, error: lastError };
}

type AttemptOutcome =
  | { ok: true; data: GeminiResponse; model: string }
  | { ok: false; error: GeminiCallFailure['error']; retryable: false }
  | { ok: false; error: GeminiCallFailure['error']; retryable: true };

async function runModelAttempts(args: {
  apiKey: string;
  body: string;
  model: string;
}): Promise<GeminiCallResult> {
  let lastError: GeminiCallFailure['error'] = null;
  for (let attempt = 0; attempt < GEMINI_MAX_ATTEMPTS_PER_MODEL; attempt += 1) {
    const outcome = await singleAttempt(args);
    if (outcome.ok) {
      return outcome;
    }
    lastError = outcome.error;
    if (!outcome.retryable) {
      break;
    }
    await sleep(GEMINI_BACKOFF_MS * (attempt + 1));
  }
  return { ok: false, error: lastError };
}

async function singleAttempt(args: {
  apiKey: string;
  body: string;
  model: string;
}): Promise<AttemptOutcome> {
  try {
    const response = await fetch(`${GEMINI_API_BASE}/models/${args.model}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': args.apiKey,
      },
      body: args.body,
    });
    const data = (await response.json()) as GeminiResponse;
    if (response.ok) {
      return { ok: true, data, model: args.model };
    }
    const retryable = response.status === 503 || response.status === 429;
    return { ok: false, error: { status: response.status, data }, retryable };
  } catch (caught) {
    return {
      ok: false,
      error: { message: caught instanceof Error ? caught.message : 'unknown_error' },
      retryable: true,
    };
  }
}

function buildRequestBody(input: CallGeminiInput): {
  systemInstruction: { parts: GeminiPart[] };
  contents: GeminiContent[];
  generationConfig: {
    temperature: number;
    maxOutputTokens: number;
    thinkingConfig: { thinkingBudget: number };
  };
} {
  return {
    systemInstruction: { parts: [{ text: input.systemPrompt }] },
    contents: [
      {
        role: 'user',
        parts: [{ text: `TRIP BRIEF FROM OPERATOR:\n\n${input.userMessage}` }],
      },
    ],
    generationConfig: {
      temperature: GEMINI_TEMPERATURE,
      maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
      thinkingConfig: { thinkingBudget: GEMINI_THINKING_BUDGET },
    },
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function extractGeminiText(response: GeminiResponse): string {
  const candidate = response.candidates?.[0];
  if (!candidate || !candidate.content) {
    return '';
  }
  return candidate.content.parts.map((part) => part.text).join('');
}
