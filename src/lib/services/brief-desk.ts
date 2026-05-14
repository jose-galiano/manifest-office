// Orchestrates the desk: pre-flight cache check → Gemini call → tag parse →
// match allocation lines back to catalogue handles → cache result.
//
// The seven security layers (origin / honeypot / validation / turnstile /
// rate-limit / cache / gemini) are wired by the route handler. This service
// only handles steps the rate-limit/cache surround.

import { EDITION_01_CATALOG, type ProductCatalogEntry } from '@/content/manifest-office';
import { callGemini, extractGeminiText, type GeminiCallFailure } from '@/lib/gemini/client';
import { buildDeskSystemPrompt } from '@/lib/gemini/prompts/desk-system';
import { cacheGet, cacheSet } from '@/lib/security/cache';

import type { DeskItem, DeskResponse } from '@/lib/types/desk';

export type BriefDeskSuccess = { ok: true; data: DeskResponse };
export type BriefDeskFailure = {
  ok: false;
  status: number;
  error: 'gemini_overloaded' | 'desk_failed';
  detail?: GeminiCallFailure['error'] | string;
};
export type BriefDeskResult = BriefDeskSuccess | BriefDeskFailure;

export type BriefDeskInput = {
  brief: string;
  ipAddress: string;
};

export async function briefDesk(input: BriefDeskInput): Promise<BriefDeskResult> {
  // Cache hit short-circuits the Gemini call.
  const cached = await cacheGet<DeskResponse>(input.brief, input.ipAddress);
  if (cached) {
    return { ok: true, data: { ...cached, cached: true } };
  }

  try {
    const geminiResult = await callGemini({
      systemPrompt: buildDeskSystemPrompt(),
      userMessage: input.brief,
    });

    if (!geminiResult.ok) {
      return {
        ok: false,
        status: 503,
        error: 'gemini_overloaded',
        detail: geminiResult.error,
      };
    }

    const rawText = extractGeminiText(geminiResult.data);
    const allocationText = extractTag(rawText, 'allocation');

    const payload: DeskResponse = {
      raw: rawText,
      re: extractTag(rawText, 're'),
      allocation: allocationText,
      forecast: extractTag(rawText, 'forecast'),
      note: extractTag(rawText, 'note'),
      total: extractTag(rawText, 'total'),
      items: matchAllocationToCatalogue(allocationText),
      model_used: geminiResult.model,
      timestamp: new Date().toISOString(),
    };

    await cacheSet(input.brief, input.ipAddress, payload);
    return { ok: true, data: payload };
  } catch (caught) {
    return {
      ok: false,
      status: 500,
      error: 'desk_failed',
      detail: caught instanceof Error ? caught.message : 'unknown_error',
    };
  }
}

function extractTag(text: string, tag: string): string {
  const match = text.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'i'));
  return match && match[1] ? match[1].trim() : '';
}

// Walks each line of the <allocation> block, picks the best-matching catalogue
// entry by title (with size suffix discrimination for the S/M/L families).
// Returns each unique handle once, in the order the model emitted them.
function matchAllocationToCatalogue(allocationText: string): DeskItem[] {
  if (!allocationText) {
    return [];
  }
  const items: DeskItem[] = [];
  const seen = new Set<string>();

  for (const line of allocationText.split('\n')) {
    const lowerLine = line.toLowerCase();
    if (!lowerLine.trim()) {
      continue;
    }
    const best = pickBestMatch(line, lowerLine);
    if (best && !seen.has(best.handle)) {
      seen.add(best.handle);
      items.push({ handle: best.handle, title: best.title, price: best.price });
    }
  }
  return items;
}

function pickBestMatch(rawLine: string, lowerLine: string): ProductCatalogEntry | null {
  let best: ProductCatalogEntry | null = null;

  for (const entry of EDITION_01_CATALOG) {
    const titleLower = entry.title.toLowerCase();
    const sizeMatch = titleLower.match(/·\s*([sml])$/i);
    const titleCore = titleLower.replace(/\s*·\s*[sml]$/i, '').trim();
    const variantTag = sizeMatch?.[1];

    if (variantTag) {
      const variantRegex = new RegExp(
        `\\b${escapeRegExp(titleCore)}\\b[^a-z0-9]+${variantTag}\\b`,
        'i',
      );
      if (variantRegex.test(rawLine)) {
        return entry;
      }
    } else if (
      lowerLine.includes(titleLower) &&
      (!best || entry.title.length > best.title.length)
    ) {
      best = entry;
    }
  }
  return best;
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
