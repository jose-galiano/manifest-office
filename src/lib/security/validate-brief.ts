// Input validation for the desk's trip brief. Three gates:
//   1. Length bounds.
//   2. Word count.
//   3. Injection-pattern blocklist (preserve verbatim) + trip-keyword sniff
//      (must contain a known travel word OR a number).

import {
  BRIEF_MAX_LENGTH,
  BRIEF_MIN_LENGTH,
  BRIEF_MIN_WORDS,
  INJECTION_PATTERNS,
  TRIP_KEYWORDS_REGEX,
} from '@/lib/constants/security';

export type ValidateBriefOk = { ok: true; trimmed: string };
export type ValidateBriefDenied = {
  ok: false;
  reason: 'too_short' | 'too_long' | 'rejected_pattern' | 'not_a_trip';
};
export type ValidateBriefResult = ValidateBriefOk | ValidateBriefDenied;

export function validateBrief(rawBrief: unknown): ValidateBriefResult {
  const trimmed = typeof rawBrief === 'string' ? rawBrief.trim() : '';
  if (trimmed.length < BRIEF_MIN_LENGTH) {
    return { ok: false, reason: 'too_short' };
  }
  if (trimmed.length > BRIEF_MAX_LENGTH) {
    return { ok: false, reason: 'too_long' };
  }

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { ok: false, reason: 'rejected_pattern' };
    }
  }

  const words = trimmed.split(/\s+/);
  if (words.length < BRIEF_MIN_WORDS) {
    return { ok: false, reason: 'too_short' };
  }

  const hasKeyword = TRIP_KEYWORDS_REGEX.test(trimmed);
  const hasNumber = /\b\d+\b/.test(trimmed);
  if (!hasKeyword && !hasNumber) {
    return { ok: false, reason: 'not_a_trip' };
  }

  return { ok: true, trimmed };
}
