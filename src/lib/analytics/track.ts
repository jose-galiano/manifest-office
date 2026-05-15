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

/**
 * Klaviyo metric-name aliases. GA4 events use snake_case; Klaviyo's built-in
 * flows (cart recovery, predictive analytics, browse abandonment) key off
 * Title Case metric names. Mapping the wire format on fan-out lets one
 * `track()` call drive BOTH GA4 reports AND Klaviyo's standard automation.
 * Events not in this map are forwarded with their GA4 name unchanged.
 */
const KLAVIYO_EVENT_MAP: Record<string, string> = {
  add_to_cart: 'Added to Cart',
  remove_from_cart: 'Removed from Cart',
  view_item: 'Viewed Product',
  view_cart: 'Viewed Cart',
  begin_checkout: 'Started Checkout',
  generate_lead: 'Subscribed to Newsletter',
  manifest_complete: 'Manifest Filed',
  reserve_click: 'Reserved Dossier',
  email_capture_submit: 'Captured Email',
};

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

// Field-mapping for first-item flattening. Each entry pairs a GA4Item field
// name with the Klaviyo property name and an optional value transform. Driving
// the flattening from a table keeps `enrichForKlaviyo` under the SonarJS
// cognitive-complexity ceiling.
type FirstItemMap = {
  readonly source:
    | 'item_id'
    | 'item_name'
    | 'item_brand'
    | 'item_variant'
    | 'item_category'
    | 'price'
    | 'quantity';
  readonly target: string;
  readonly transform?: (value: unknown) => unknown;
};
const FIRST_ITEM_MAPPINGS: readonly FirstItemMap[] = [
  { source: 'item_id', target: 'ProductID' },
  { source: 'item_name', target: 'ProductName' },
  { source: 'item_brand', target: 'Brand' },
  { source: 'item_variant', target: 'Variant' },
  { source: 'item_category', target: 'Categories', transform: (value) => [value] },
  { source: 'price', target: 'Price' },
  { source: 'quantity', target: 'Quantity' },
];

/**
 * Flattens a GA4 ecommerce payload into Klaviyo's expected top-level
 * properties. The first item's fields are surfaced verbatim (ProductID,
 * ProductName, Brand, Variant, Price, Quantity, Categories) so Klaviyo's
 * built-in Browse Abandonment / Cart Recovery flows can hydrate their
 * dynamic blocks without custom mappings. The full items array is preserved
 * as `Items` for any analyses that need quantity/variant breakdowns.
 */
function enrichForKlaviyo(
  params: EventParams,
  ecommerce: EcommercePayload | undefined,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...params };
  if (!ecommerce) return out;

  if (typeof ecommerce.value === 'number') out.$value = ecommerce.value;
  if (typeof ecommerce.currency === 'string') out.Currency = ecommerce.currency;

  const items = ecommerce.items ?? [];
  if (items.length === 0) return out;

  const first = items[0];
  if (first) {
    for (const { source, target, transform } of FIRST_ITEM_MAPPINGS) {
      const value = first[source];
      if (value === undefined) continue;
      out[target] = transform ? transform(value) : value;
    }
  }

  out.Items = items;
  out.ItemNames = items.map((item) => item.item_name).filter((name) => Boolean(name));
  return out;
}

function fanoutToKlaviyo(
  event: string,
  params: EventParams,
  ecommerce: EcommercePayload | undefined,
  email: string | undefined,
): void {
  if (typeof window === 'undefined') return;
  const klaviyoEvent = KLAVIYO_EVENT_MAP[event] ?? event;
  const enriched = enrichForKlaviyo(params, ecommerce);
  const body = {
    event: klaviyoEvent,
    email,
    anonymousId: getAnonymousId(),
    properties: {
      ...enriched,
      page_path: window.location.pathname,
      page_url: window.location.href,
    },
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
    fanoutToKlaviyo(eventName, params ?? {}, ecommerce, fanout.email);
  }
}
