/**
 * Google Consent Mode v2 wiring.
 *
 * The default state (everything denied) MUST be pushed to `dataLayer`
 * BEFORE the GTM script loads, otherwise GA4 will start with `granted`
 * and we leak data on first paint. The inline-head script in
 * `Analytics.tsx` calls `setDefaultConsent()` synchronously to guarantee
 * that ordering.
 *
 * When the user accepts the banner, `grantConsent()` issues an `update`
 * command which GA4/GTM consume in the same tick. Until then, tracking
 * runs in modeled-conversion mode (analytics_storage=denied → GA4 still
 * receives pings but assigns no client_id and drops PII).
 *
 * Storage key matches the legacy `mo_*` namespace used elsewhere.
 */

const CONSENT_STORAGE_KEY = 'mo_consent_v1';

export type ConsentChoice = 'granted' | 'denied';

export type ConsentState = {
  ad_storage: ConsentChoice;
  ad_user_data: ConsentChoice;
  ad_personalization: ConsentChoice;
  analytics_storage: ConsentChoice;
  functionality_storage: ConsentChoice;
  security_storage: ConsentChoice;
};

export const DENIED_CONSENT: ConsentState = {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  functionality_storage: 'granted',
  security_storage: 'granted',
};

export const GRANTED_CONSENT: ConsentState = {
  ad_storage: 'granted',
  ad_user_data: 'granted',
  ad_personalization: 'granted',
  analytics_storage: 'granted',
  functionality_storage: 'granted',
  security_storage: 'granted',
};

type GtagFn = (command: 'consent', action: 'default' | 'update', state: ConsentState) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: GtagFn;
  }
}

function ensureGtag(): GtagFn {
  if (typeof window === 'undefined') {
    return () => undefined;
  }
  window.dataLayer = window.dataLayer ?? [];
  if (!window.gtag) {
    // Classic GA bootstrap: `gtag` pushes its arguments object onto dataLayer
    // so GTM can replay them in order once the container loads.
    window.gtag = function gtag(...args: unknown[]): void {
      window.dataLayer?.push(args);
    } as GtagFn;
  }
  return window.gtag;
}

/** Inline-head script body: stringified so it can be dropped into <Script>. */
export const CONSENT_DEFAULT_SCRIPT = `
window.dataLayer = window.dataLayer || [];
function gtag(){window.dataLayer.push(arguments);}
window.gtag = window.gtag || gtag;
gtag('consent', 'default', ${JSON.stringify(DENIED_CONSENT)});
gtag('set', 'ads_data_redaction', true);
gtag('set', 'url_passthrough', true);
`.trim();

export function readStoredConsent(): ConsentChoice | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (raw === 'granted' || raw === 'denied') return raw;
    return null;
  } catch {
    return null;
  }
}

function persistConsent(choice: ConsentChoice): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
  } catch {
    // Storage blocked. The in-tab state still reflects user choice.
  }
}

export const CONSENT_GRANTED_EVENT = 'mo:consent-granted';

export function grantConsent(): void {
  ensureGtag()('consent', 'update', GRANTED_CONSENT);
  persistConsent('granted');
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(CONSENT_GRANTED_EVENT));
  }
}

export function denyConsent(): void {
  ensureGtag()('consent', 'update', DENIED_CONSENT);
  persistConsent('denied');
}
