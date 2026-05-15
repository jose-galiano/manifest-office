/**
 * `<DeskBrief />` — the trip-brief recommender form on the PDP.
 *
 * Ports `deploy/pdp.html` lines 1056-1075 (markup) + the IIFE starting at
 * 1841 (logic) into a typed React client component. Behaviour matches legacy
 * verbatim:
 *
 *  - Honeypot field (`name="website"`) — invisible to humans, irresistible to
 *    bots.
 *  - Cloudflare Turnstile widget — loaded only when `GET /api/config` returns
 *    a non-null `turnstile_site_key`. Invisible widget, executed inline
 *    immediately before submit, reset after every response.
 *  - Submit posts `{ brief, honey, turnstile }` to `/api/desk`, awaits the
 *    typed `DeskResponse`, and renders a memo via a teletype animation.
 *  - "Make this manifest · N items" follow-up button reserves each item via
 *    the server action and opens the cart drawer.
 *  - Error states map verbatim: rate-limited (429), invalid_brief,
 *    gemini_overloaded, turnstile_required (403).
 *  - Klaviyo events `Desk Briefed` and `Desk Manifest Built` fire via
 *    `/api/track`.
 *
 * Hash auto-focus: when `window.location.hash === '#desk'` on mount (or on
 * `hashchange`), the section scrolls into view and the textarea takes focus
 * after the smooth-scroll settles. Wave 2 wired the landing-page CTA and
 * footer links to `/products/<handle>#desk`.
 */

'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';

import { reserveProductAction } from '@/app/products/[handle]/actions';
import { findProductByShopifyHandle } from '@/content/manifest-office';
import { useCart } from '@/hooks/use-cart';

import type { DeskItem, DeskResponse } from '@/lib/types/desk';
import type { ReactElement } from 'react';

// ---------------------------------------------------------------------------
// Turnstile widget — minimal typed shim. The script is loaded dynamically;
// declaring the surface lets the component compile against it without `any`.
// ---------------------------------------------------------------------------

type TurnstileOptions = {
  readonly sitekey: string;
  readonly size?: 'invisible' | 'normal' | 'compact';
  readonly callback?: (token: string) => void;
  readonly 'error-callback'?: () => void;
  readonly 'expired-callback'?: () => void;
};

type TurnstileApi = {
  render: (container: HTMLElement, options: TurnstileOptions) => string;
  execute: (widgetId: string) => void;
  reset: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

// ---------------------------------------------------------------------------
// Constants — extracted from legacy IIFE for reuse and visibility.
// ---------------------------------------------------------------------------

const BRIEF_MIN_LENGTH = 10;
const BRIEF_MAX_LENGTH = 800;
const TELETYPE_BASE_MS = 8;
const TELETYPE_JITTER_MS = 12;
const TURNSTILE_WAIT_TICKS = 30;
const TURNSTILE_WAIT_INTERVAL_MS = 100;
const TELETYPE_TIMEOUT_MS = 5000;
const HASH_FOCUS_SCROLL_DELAY_MS = 250;
const HASH_FOCUS_TEXTAREA_DELAY_MS = 500;

const PLACEHOLDER_BRIEF =
  'Five days in Mexico City. Two client meetings, one studio visit. Carry-on only. October.';

const HINT_DEFAULT = 'RETURN TO SUBMIT · GEMINI 2.5 FLASH · 5/HR · 20/DAY';
const HINT_COMPOSING = 'DESK COMPOSING · STAND BY';
const HINT_DONE = 'GEMINI 2.5 FLASH · BRIEFED IN REAL TIME';

const SUBMIT_DEFAULT = '↗ BRIEF THE DESK';
const SUBMIT_BUSY = '↻ BRIEFING…';

const ERR_SHORT = '— BRIEF TOO SHORT. DESCRIBE THE TRIP IN A FULL SENTENCE.';
const ERR_INVALID = 'DESK ONLY ACCEPTS TRIP BRIEFS. DESCRIBE A TRIP, DURATION, AND PURPOSE.';
const ERR_OVERLOADED = 'THE DESK IS BRIEFING ANOTHER OPERATOR.\nTRY AGAIN IN A FEW SECONDS.';
const ERR_TURNSTILE = 'VERIFICATION REQUIRED. REFRESH THE PAGE AND RETRY.';
const ERR_GENERIC = 'DESK TEMPORARILY UNAVAILABLE — RETRY.';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type ConfigResponse = { readonly turnstile_site_key: string | null };

async function fetchTurnstileSiteKey(): Promise<string | null> {
  try {
    const response = await fetch('/api/config');
    if (!response.ok) return null;
    const json: unknown = await response.json();
    if (!json || typeof json !== 'object') return null;
    const siteKey = (json as Partial<ConfigResponse>).turnstile_site_key;
    return typeof siteKey === 'string' && siteKey.length > 0 ? siteKey : null;
  } catch {
    return null;
  }
}

function loadTurnstileScript(): Promise<TurnstileApi | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(null);
      return;
    }
    if (window.turnstile) {
      resolve(window.turnstile);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.onload = (): void => resolve(window.turnstile ?? null);
    script.onerror = (): void => resolve(null);
    document.head.appendChild(script);
  });
}

function formatMemo(brief: string, data: DeskResponse): string {
  const sections: string[] = [];
  sections.push(`TO     · Operator`);
  sections.push(`FROM   · Manifest Office Desk`);
  sections.push(`RE     · ${data.re || brief.slice(0, 60)}`);
  sections.push('');
  sections.push('ALLOCATION');
  sections.push(data.allocation);
  if (data.forecast) {
    sections.push('');
    sections.push('FORECAST');
    sections.push(data.forecast);
  }
  if (data.note) {
    sections.push('');
    sections.push('NOTE');
    sections.push(data.note);
  }
  sections.push('');
  sections.push(`→ DRAFT READY · ${data.total || 'EDITION 01 ALLOCATION'}`);
  return sections.join('\n');
}

function describeError(status: number, body: unknown): string {
  const error =
    typeof body === 'object' && body !== null ? (body as { error?: string }).error : undefined;
  const retryAfter =
    typeof body === 'object' && body !== null
      ? (body as { retry_after_sec?: number }).retry_after_sec
      : undefined;
  if (status === 429) {
    const minutes =
      typeof retryAfter === 'number' ? ` TRY AGAIN IN ${Math.ceil(retryAfter / 60)} MIN.` : '';
    return `DESK RATE LIMIT REACHED FOR THIS OPERATOR.${minutes}`;
  }
  if (status === 403 && error === 'turnstile_required') return ERR_TURNSTILE;
  if (error === 'invalid_brief') return ERR_INVALID;
  if (error === 'gemini_overloaded') return ERR_OVERLOADED;
  return ERR_GENERIC;
}

function getStoredAnonymousId(): string {
  if (typeof window === 'undefined') return 'desk_anon';
  return window.localStorage.getItem('mo_anon') ?? 'desk_anon';
}

function getStoredEmail(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('mo_email');
}

function fireTrack(event: string, properties: Record<string, unknown>): void {
  try {
    void fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event,
        anonymousId: getStoredAnonymousId(),
        email: getStoredEmail(),
        properties,
      }),
    });
  } catch {
    // Tracking is best-effort; never let it break the UX.
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type DeskBriefProps = {
  /** Optional anchor id — defaults to `desk` to honour `#desk` deep links. */
  readonly anchorId?: string;
};

export function DeskBrief({ anchorId = 'desk' }: DeskBriefProps): ReactElement {
  const hintId = useId();
  const responseId = useId();
  const honeyId = useId();

  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const turnstileHostRef = useRef<HTMLDivElement | null>(null);
  const turnstileApiRef = useRef<TurnstileApi | null>(null);
  const turnstileWidgetRef = useRef<string | null>(null);
  const turnstileTokenRef = useRef<string | null>(null);
  const turnstileSiteKeyRef = useRef<string | null>(null);
  const teletypeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [hint, setHint] = useState(HINT_DEFAULT);
  const [submitting, setSubmitting] = useState(false);
  const [memo, setMemo] = useState<string>('');
  const [errorLine, setErrorLine] = useState<string>('');
  const [items, setItems] = useState<readonly DeskItem[]>([]);
  const [reserving, setReserving] = useState(false);
  const [reservedCount, setReservedCount] = useState<number | null>(null);

  const cart = useCart();

  // --- Turnstile init ----------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    const initTurnstile = async (): Promise<void> => {
      const siteKey = await fetchTurnstileSiteKey();
      if (cancelled || !siteKey) return;
      turnstileSiteKeyRef.current = siteKey;
      const api = await loadTurnstileScript();
      if (cancelled || !api || !turnstileHostRef.current) return;
      turnstileApiRef.current = api;
      turnstileWidgetRef.current = api.render(turnstileHostRef.current, {
        sitekey: siteKey,
        size: 'invisible',
        callback: (token) => {
          turnstileTokenRef.current = token;
        },
        'error-callback': () => {
          turnstileTokenRef.current = null;
        },
        'expired-callback': () => {
          turnstileTokenRef.current = null;
          if (turnstileWidgetRef.current && turnstileApiRef.current) {
            turnstileApiRef.current.reset(turnstileWidgetRef.current);
          }
        },
      });
    };
    void initTurnstile();
    return (): void => {
      cancelled = true;
    };
  }, []);

  // --- Hash-driven focus -------------------------------------------------
  useEffect(() => {
    const targetHash = `#${anchorId}`;
    const handleHash = (): void => {
      if (typeof window === 'undefined') return;
      if (window.location.hash !== targetHash) return;
      const element = document.getElementById(anchorId);
      if (!element || !inputRef.current) return;
      setTimeout(() => {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => {
          inputRef.current?.focus({ preventScroll: true });
        }, HASH_FOCUS_TEXTAREA_DELAY_MS);
      }, HASH_FOCUS_SCROLL_DELAY_MS);
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return (): void => window.removeEventListener('hashchange', handleHash);
  }, [anchorId]);

  // --- Cleanup teletype on unmount --------------------------------------
  useEffect(() => {
    return (): void => {
      if (teletypeTimerRef.current) clearTimeout(teletypeTimerRef.current);
    };
  }, []);

  // --- Teletype animation -----------------------------------------------
  const teletypeMemo = useCallback((text: string): void => {
    if (teletypeTimerRef.current) clearTimeout(teletypeTimerRef.current);
    setMemo('');
    let cursor = 0;
    const tick = (): void => {
      if (cursor >= text.length) return;
      cursor += 1;
      setMemo(text.slice(0, cursor));
      teletypeTimerRef.current = setTimeout(
        tick,
        TELETYPE_BASE_MS + Math.random() * TELETYPE_JITTER_MS,
      );
    };
    tick();
    // Safety net — never let the teletype run past a hard limit.
    setTimeout(() => setMemo(text), TELETYPE_TIMEOUT_MS);
  }, []);

  // --- Turnstile token acquisition --------------------------------------
  const acquireTurnstileToken = useCallback(async (): Promise<string | null> => {
    const api = turnstileApiRef.current;
    const widget = turnstileWidgetRef.current;
    if (!turnstileSiteKeyRef.current || !api || !widget) return null;
    try {
      api.execute(widget);
    } catch {
      // Fail-open — submit anyway; the server will reject if required.
    }
    for (let i = 0; i < TURNSTILE_WAIT_TICKS; i += 1) {
      if (turnstileTokenRef.current) return turnstileTokenRef.current;
      await new Promise((resolve) => setTimeout(resolve, TURNSTILE_WAIT_INTERVAL_MS));
    }
    return turnstileTokenRef.current;
  }, []);

  const resetTurnstile = useCallback((): void => {
    const api = turnstileApiRef.current;
    const widget = turnstileWidgetRef.current;
    if (api && widget) {
      try {
        api.reset(widget);
      } catch {
        // ignore — next submit will retry
      }
    }
    turnstileTokenRef.current = null;
  }, []);

  // --- Submit ------------------------------------------------------------
  const brief = useCallback(async (): Promise<void> => {
    const input = inputRef.current;
    if (!input) return;
    const text = (input.value || PLACEHOLDER_BRIEF).trim();

    setErrorLine('');
    setMemo('');
    setItems([]);
    setReservedCount(null);

    if (!text || text.length < BRIEF_MIN_LENGTH) {
      setErrorLine(ERR_SHORT);
      return;
    }

    setSubmitting(true);
    setHint(HINT_COMPOSING);

    const turnstileToken = await acquireTurnstileToken();
    const honey = (document.getElementById(honeyId) as HTMLInputElement | null)?.value ?? '';

    try {
      const response = await fetch('/api/desk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief: text, honey, turnstile: turnstileToken ?? '' }),
      });
      const body: unknown = await response.json();
      resetTurnstile();

      const hasAllocation =
        response.ok &&
        typeof body === 'object' &&
        body !== null &&
        typeof (body as Partial<DeskResponse>).allocation === 'string';

      if (!hasAllocation) {
        setErrorLine(`— ${describeError(response.status, body)}`);
        setHint(HINT_DONE);
        return;
      }

      const data = body as DeskResponse;
      const memoText = formatMemo(text, data);
      teletypeMemo(memoText);
      setItems(data.items ?? []);
      setHint(HINT_DONE);

      fireTrack('Desk Briefed', {
        trip_brief: text,
        response_total: data.total ?? '',
      });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'unknown_error';
      setErrorLine(`— NETWORK ERROR · ${message}`);
      setHint(HINT_DONE);
    } finally {
      setSubmitting(false);
    }
  }, [acquireTurnstileToken, honeyId, resetTurnstile, teletypeMemo]);

  // --- Build the manifest from the recommended items --------------------
  const buildManifest = useCallback(async (): Promise<void> => {
    if (items.length === 0 || reserving) return;
    setReserving(true);
    let reserved = 0;
    let subtotal = 0;
    for (const item of items) {
      // `DeskItem.handle` carries the Shopify handle (with `manifest-` prefix).
      // The cart store works in storefront handles — translate before adding.
      const catalogEntry = findProductByShopifyHandle(item.handle);
      const storefrontHandle = catalogEntry?.handle ?? item.handle.replace(/^manifest-/, '');
      const result = await reserveProductAction(storefrontHandle, null);
      if (!result.ok) continue;
      // Skip sold-out responses; only count successful issues.
      if ('sold_out' in result.data) continue;
      cart.add({
        handle: storefrontHandle,
        title: item.title,
        price: item.price,
        imageUrl: '',
        issuedAs: result.data.issue,
      });
      reserved += 1;
      subtotal += item.price;
    }
    setReservedCount(reserved);
    setReserving(false);
    setTimeout(() => cart.openDrawer(), 400);
    fireTrack('Desk Manifest Built', {
      items_reserved: reserved,
      cart_subtotal: subtotal,
    });
  }, [cart, items, reserving]);

  // --- Keyboard ----------------------------------------------------------
  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>): void => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        void brief();
      }
    },
    [brief],
  );

  const onSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>): void => {
      event.preventDefault();
      void brief();
    },
    [brief],
  );

  // --- Render ------------------------------------------------------------
  return (
    <section
      id={anchorId}
      className="border-y border-[rgba(11,15,14,0.12)] bg-[#0B0F0E] px-5 md:px-10 py-20 text-[#F2EFE8]"
    >
      <div className="mx-auto max-w-[1100px]">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#D24A1F]">
          THE DESK · BETA
        </span>
        <h2 className="mt-6 font-display font-bold leading-[0.95] tracking-[-0.02em] text-[clamp(36px,4vw,56px)]">
          Tell us the trip.
          <br />
          The desk responds
          <br />
          with the kit.
        </h2>
        <p className="mt-6 max-w-[60ch] text-[15px] leading-[1.7] text-[#F2EFE8]/75">
          Describe a trip in plain language. The desk returns a recommended allocation, a printable
          manifest, and a checklist you can save. Built on Gemini 2.5 Flash. Trained on Edition 01
          use patterns. No chat. No bot. A desk.
        </p>

        <form
          onSubmit={onSubmit}
          autoComplete="off"
          className="mt-10 border border-[rgba(242,239,232,0.18)] bg-[rgba(242,239,232,0.04)] p-6"
        >
          <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[#F2EFE8]/60">
            BRIEF THE DESK · MEMO TO MANIFEST OFFICE
          </div>

          <div className="flex items-start gap-3">
            <span aria-hidden="true" className="mt-1 font-mono text-[#D24A1F]">
              →
            </span>
            <textarea
              ref={inputRef}
              rows={2}
              maxLength={BRIEF_MAX_LENGTH}
              placeholder={PLACEHOLDER_BRIEF}
              onKeyDown={onKeyDown}
              aria-describedby={hintId}
              className="flex-1 resize-none border-0 bg-transparent font-mono text-[14px] text-[#F2EFE8] outline-none placeholder:text-[#F2EFE8]/40"
            />
          </div>

          {/* Honeypot — invisible to humans, irresistible to bots. */}
          <input
            type="text"
            name="website"
            id={honeyId}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: '-9999px',
              width: 1,
              height: 1,
              opacity: 0,
              pointerEvents: 'none',
            }}
          />

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <span
              id={hintId}
              className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#F2EFE8]/50"
            >
              {hint}
            </span>
            <button
              type="submit"
              disabled={submitting}
              className="bg-[#F2EFE8] px-5 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0B0F0E] transition-all duration-200 hover:bg-[#D24A1F] hover:text-[#F2EFE8] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? SUBMIT_BUSY : SUBMIT_DEFAULT}
            </button>
          </div>

          <div ref={turnstileHostRef} className="mt-3" />
        </form>

        {(memo || errorLine) && (
          <div
            id={responseId}
            role="status"
            aria-live="polite"
            className="mt-8 whitespace-pre-wrap border border-[rgba(242,239,232,0.18)] bg-[rgba(11,15,14,0.6)] p-6 font-mono text-[13px] leading-[1.7] text-[#F2EFE8]"
          >
            {errorLine || memo}
          </div>
        )}

        {items.length > 0 && reservedCount === null && (
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[rgba(242,239,232,0.15)] pt-5">
            <button
              type="button"
              onClick={() => void buildManifest()}
              disabled={reserving}
              className="bg-[#F2EFE8] px-5 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0B0F0E] transition-all duration-200 hover:bg-[#D24A1F] hover:text-[#F2EFE8] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {reserving ? '↻ RESERVING…' : `↗ MAKE THIS MANIFEST · ${items.length} ITEMS`}
            </button>
            <span className="font-mono text-[10px] uppercase tracking-[0.10em] text-[#F2EFE8]/55">
              → RESERVES ALL DOSSIERS · OPENS CART
            </span>
          </div>
        )}

        {reservedCount !== null && (
          <div className="mt-6 border-t border-[rgba(242,239,232,0.15)] pt-5">
            <span className="bg-[#D24A1F] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[#F2EFE8]">
              ✓ {reservedCount} DOSSIERS ISSUED
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
