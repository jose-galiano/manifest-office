/**
 * Anonymous + session identifiers.
 *
 * Two ids are kept side-by-side:
 *   - `anonymous_id` (localStorage, persists across sessions). Used to stitch
 *     a return visitor to their prior pseudonymous activity, and as the
 *     primary key passed to Klaviyo `/api/track` when no email is known.
 *   - `session_id` (sessionStorage, expires on tab close). Lets GTM/GA4
 *     group events for a single browsing session even when the GA4
 *     `client_id` is suppressed by Consent Mode.
 *
 * SSR-safe: every accessor short-circuits when `window` is undefined.
 * Storage failures (privacy mode, full quota) fall back to in-memory ids
 * so analytics never throws.
 */

const ANON_KEY = 'mo_anon_id';
const SESSION_KEY = 'mo_session_id';

let inMemoryAnonId: string | null = null;
let inMemorySessionId: string | null = null;

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function safeGet(storage: Storage | undefined, key: string): string | null {
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(storage: Storage | undefined, key: string, value: string): void {
  if (!storage) return;
  try {
    storage.setItem(key, value);
  } catch {
    // Quota or access denied — caller falls through to in-memory.
  }
}

function makeId(prefix: string): string {
  // crypto.randomUUID is available in every browser we target (Next 15 / Node 22).
  if (isBrowser() && typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  // Fallback for non-secure contexts (rare): timestamp + random.
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getAnonymousId(): string {
  if (!isBrowser()) return 'ssr';
  if (inMemoryAnonId) return inMemoryAnonId;
  const stored = safeGet(window.localStorage, ANON_KEY);
  if (stored) {
    inMemoryAnonId = stored;
    return stored;
  }
  const created = makeId('anon');
  safeSet(window.localStorage, ANON_KEY, created);
  inMemoryAnonId = created;
  return created;
}

export function getSessionId(): string {
  if (!isBrowser()) return 'ssr';
  if (inMemorySessionId) return inMemorySessionId;
  const stored = safeGet(window.sessionStorage, SESSION_KEY);
  if (stored) {
    inMemorySessionId = stored;
    return stored;
  }
  const created = makeId('sess');
  safeSet(window.sessionStorage, SESSION_KEY, created);
  inMemorySessionId = created;
  return created;
}
