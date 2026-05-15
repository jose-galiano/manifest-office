// SEO surface constants. Single source of truth for the origin, brand
// identity, contact, address, and Edition 01 close date that downstream
// schema builders need. Sourcing these in one place stops typos from
// diverging between layout-level `Organization` JSON-LD and PDP-level
// `Product` JSON-LD.

export const SITE_ORIGIN = 'https://demo.maelify.com';

export const BRAND_NAME = 'Manifest Office';
export const BRAND_LEGAL_NAME = 'Manifest Office Goods';
export const BRAND_DESCRIPTION =
  'A modular travel-kit system, finished in Porto. Edition 01 — 1,200 systems issued.';
export const BRAND_LOGO_URL = `${SITE_ORIGIN}/brand/logo.svg`;
export const BRAND_FOUNDING_DATE = '2026-01-01';

export const BRAND_SAME_AS: readonly string[] = [
  'https://www.linkedin.com/company/manifest-office/',
  'https://www.instagram.com/manifest.office/',
];

export const CONTACT_EMAIL = 'hello@maelify.com';

export const PORTO_ADDRESS = {
  streetAddress: 'Rua de Santa Catarina, 1',
  addressLocality: 'Porto',
  addressRegion: 'Porto',
  postalCode: '4000-441',
  addressCountry: 'PT',
} as const;

/**
 * Edition 01 closes at end of 2026. Used as `priceValidUntil`. Once Edition 02
 * opens, this constant moves with the active edition.
 */
export const EDITION_01_CLOSE_DATE = '2026-12-31';

export const DEFAULT_PRICE_CURRENCY = 'EUR';

/**
 * Google product taxonomy fallback. The full taxonomy is at
 * https://www.google.com/basepages/producttype/taxonomy.en-US.txt.
 * Travel & garment bags is the closest accepted node for the system.
 */
export const PRODUCT_CATEGORY_DEFAULT =
  'Apparel & Accessories > Handbags, Wallets & Cases > Luggage & Bags > Travel & Garment Bags';

/**
 * Hardware (Anchor Latch, Luggage Tag) maps to a different taxonomy node —
 * accessories live one level below the bags themselves.
 */
export const PRODUCT_CATEGORY_HARDWARE =
  'Apparel & Accessories > Handbags, Wallets & Cases > Luggage & Bags Accessories';
