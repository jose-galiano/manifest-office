/**
 * Analytics event taxonomy.
 *
 * The dataLayer is untyped at runtime, but a named registry of events here:
 *   1. catches typos at compile time (the #1 way real-world analytics rot),
 *   2. doubles as living documentation of what we measure and why,
 *   3. lets the GTM container author write triggers against a stable list.
 *
 * Adding an event = add the literal here + the matching params type. The
 * `track()` helper accepts both registered and arbitrary names (the long
 * tail of `data-track` element clicks is open by design), but registered
 * events get param-shape checking.
 */

/** GA4-canonical ecommerce events (kept verbatim so GA4 reports work). */
export const ECOMMERCE_EVENTS = {
  viewItem: 'view_item',
  viewItemList: 'view_item_list',
  selectItem: 'select_item',
  addToCart: 'add_to_cart',
  removeFromCart: 'remove_from_cart',
  viewCart: 'view_cart',
  beginCheckout: 'begin_checkout',
  generateLead: 'generate_lead',
} as const;

/** Manifest Office product-specific events. Snake_case to match GA4 style. */
export const CUSTOM_EVENTS = {
  pageView: 'page_view',
  sectionView: 'section_view',
  sectionDwell: 'section_dwell',
  scrollDepth: 'scroll_depth',
  elementClick: 'element_click',
  rageClick: 'rage_click',
  deadClick: 'dead_click',
  outboundClick: 'outbound_click',
  reserveClick: 'reserve_click',
  viewer3dRotate: 'viewer_3d_rotate',
  viewer3dExplode: 'viewer_3d_explode',
  viewer3dAssemble: 'viewer_3d_assemble',
  scrollPinPanel: 'scroll_pin_panel',
  cartDrawerOpen: 'cart_drawer_open',
  cartDrawerClose: 'cart_drawer_close',
  teletypeComplete: 'teletype_complete',
  variantView: 'variant_view',
  dossierFilter: 'dossier_filter',
  emailCaptureSubmit: 'email_capture_submit',
  consentGranted: 'consent_granted',
  consentDenied: 'consent_denied',
} as const;

export type EcommerceEventName = (typeof ECOMMERCE_EVENTS)[keyof typeof ECOMMERCE_EVENTS];
export type CustomEventName = (typeof CUSTOM_EVENTS)[keyof typeof CUSTOM_EVENTS];
export type KnownEventName = EcommerceEventName | CustomEventName;

/**
 * GA4 ecommerce item shape. Mirrors the Google spec so reports populate
 * (`Reports → Monetization → Ecommerce purchases` requires this exact
 * field naming).
 */
export type GA4Item = {
  item_id: string;
  item_name: string;
  item_brand?: string;
  item_category?: string;
  item_variant?: string;
  price?: number;
  quantity?: number;
  currency?: string;
  index?: number;
};

export type EcommercePayload = {
  currency?: string;
  value?: number;
  items: GA4Item[];
};

/** Free-form parameters allowed on any custom event. */
export type EventParams = Record<string, string | number | boolean | null | undefined>;

/**
 * Envelope pushed to `window.dataLayer`. Includes a generated session/anon
 * id pair so GTM can stitch a visitor's actions even before consent grants
 * them a GA4 client_id.
 */
export type DataLayerEvent = {
  event: string;
  session_id: string;
  anonymous_id: string;
  page_path: string;
  page_title?: string;
  timestamp_ms: number;
  ecommerce?: EcommercePayload;
  // Spread params (flat) live alongside the envelope fields.
  [key: string]: unknown;
};
