/**
 * Single-call analytics track helper.
 *
 * Every interaction in the app funnels through `track()`. The function:
 *   1. Builds a normalised envelope (event name + session/anon ids + page
 *      context + timestamp) so the GTM container author writes triggers
 *      against a known shape.
 *   2. Pushes to `window.dataLayer` so GTM/GA4 consume it.
 *   3. Optionally fans out to Klaviyo `/api/track` for events that should
 *      land in marketing automation too (Reserved, Email Saved, etc.).
 *
 * SSR-safe: server-side calls become no-ops (no dataLayer, no fetch).
 * Consent-aware: Consent Mode v2 handles GA4 throttling. We always push to
 * dataLayer so debug tooling stays useful; downstream tags respect consent.
 */

import { getAnonymousId, getSessionId } from './identity';

import type { DataLayerEvent, EcommercePayload, EventParams } from './types';

type FanoutOptions = {
  /** Mirror the event into Klaviyo via `/api/track`. */
  klaviyo?: boolean;
  /** Customer email (only sent on identified events). */
  email?: string;
};

export type TrackOptions = {
  params?: EventParams;
  ecommerce?: EcommercePayload;
  fanout?: FanoutOptions;
};

function getPageContext(): { page_path: string; page_title?: string } {
  if (typeof window === 'undefined') {
    return { page_path: '/' };
  }
  return {
    page_path: window.location.pathname + window.location.search,
    page_title: document.title || undefined,
  };
}

function pushToDataLayer(event: DataLayerEvent): void {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer ?? [];
  // Reset ecommerce between pushes so GTM's recommended pattern works
  // (`gtag('event', ...)` always re-emits the full ecommerce object).
  if (event.ecommerce) {
    window.dataLayer.push({ ecommerce: null });
  }
  window.dataLayer.push(event);
}

function fanoutToKlaviyo(event: string, params: EventParams, email?: string): void {
  if (typeof window === 'undefined') return;
  const body = {
    event,
    email,
    anonymousId: getAnonymousId(),
    properties: { ...params, page_path: window.location.pathname },
  };
  // Fire-and-forget. `keepalive` lets the request survive a page nav,
  // which is critical for events like `reserve_click` that immediately
  // open a drawer or navigate.
  fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => undefined);
}

export function track(eventName: string, options: TrackOptions = {}): void {
  const { params, ecommerce, fanout } = options;
  const context = getPageContext();
  const envelope: DataLayerEvent = {
    event: eventName,
    session_id: getSessionId(),
    anonymous_id: getAnonymousId(),
    page_path: context.page_path,
    page_title: context.page_title,
    timestamp_ms: Date.now(),
    ...(params ?? {}),
    ...(ecommerce ? { ecommerce } : {}),
  };
  pushToDataLayer(envelope);
  if (fanout?.klaviyo) {
    fanoutToKlaviyo(eventName, params ?? {}, fanout.email);
  }
}
