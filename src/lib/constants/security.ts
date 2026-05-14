// Security thresholds and patterns for `/api/desk`.

export const BRIEF_MIN_LENGTH = 10;
export const BRIEF_MAX_LENGTH = 800;
export const BRIEF_MIN_WORDS = 3;

export const RATE_LIMIT_PER_HOUR = 5;
export const RATE_LIMIT_PER_DAY = 20;
export const RATE_LIMIT_HOUR_SECONDS = 3600;
export const RATE_LIMIT_DAY_SECONDS = 86400;

export const DESK_CACHE_TTL_SECONDS = 3600;

export const ALLOWED_ORIGINS: ReadonlySet<string> = new Set([
  'https://demo.maelify.com',
  'https://manifest-office.vercel.app',
  'http://localhost:8765',
  'http://localhost:3000',
]);

// Allow any preview deploy under the tmsjoses-projects Vercel team.
export const VERCEL_PREVIEW_ORIGIN_REGEX =
  /^https:\/\/manifest-office-[a-z0-9]+-tmsjoses-projects\.vercel\.app$/;

// Injection patterns — preserved verbatim from `deploy/api/_lib/security.js:63-76`.
// Maelify §3 forbids mutation of this list without a corresponding review of
// the desk's threat model.
export const INJECTION_PATTERNS: readonly RegExp[] = [
  /ignore\s+(?:all\s+)?(?:previous|prior|above)\s+(?:instructions?|prompts?|rules?)/i,
  /disregard\s+(?:all\s+)?(?:previous|prior|above|your)/i,
  /(?:you\s+are\s+now|act\s+as|pretend\s+(?:to\s+be|you'?re)|roleplay\s+as)\s+(?:a|an|the)\s+(?!quartermaster|desk|operator|traveler|operator)/i,
  /system\s*(?:prompt|message|instruction)/i,
  /forget\s+(?:everything|all|your\s+instructions)/i,
  /print\s+(?:your|the)\s+(?:system|initial|first)\s+prompt/i,
  /reveal\s+(?:your|the)\s+(?:system|instructions|prompt)/i,
  /<\/?\s*\|?\s*(?:im_start|im_end|system|assistant)\s*\|?\s*>/i,
  /jailbreak|DAN\s+mode|developer\s+mode/i,
  /write\s+(?:a|an)\s+(?:essay|poem|story|article|code|script|program|function)\s+(?:about|on|for)/i,
  /translate\s+(?:this|the\s+following)\s+(?:to|into)\s+\w+/i,
  /solve\s+(?:this|the\s+following)\s+(?:math|equation|problem)/i,
];

export const TRIP_KEYWORDS_REGEX =
  /\b(day|days|night|nights|week|month|trip|travel|fly|flight|flying|business|meeting|meetings|client|conference|summit|launch|wedding|festival|tour|hike|hiking|camp|safari|carry|carry-?on|pack|packing|weekend|hotel|airport|city|cities|country|abroad|international|domestic|destination|visit|expedition|board(?:room)?|studio|factory|photo|shoot|residency|workshop|sprint|retreat|off-?site|onboard|deploy|remote|wfh|coast|island|desert|mountain|forest|trail|run|race|marathon|tour|drive|road)\b/i;
