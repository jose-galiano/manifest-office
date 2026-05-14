/**
 * Manifest Office — content single source of truth.
 *
 * Canonical export for Edition 01 product catalogue, collection definitions,
 * and static page handles. Anything that needs Edition 01 SKUs (PDP, PLP,
 * desk recommender, sitemap) imports from here.
 *
 * Provenance:
 *  - Product list mirrors `deploy/api/desk.js` lines 10-21 (Edition 01 desk
 *    catalogue), aligned with the handle order in `deploy/api/products.js`.
 *  - Edition metadata mirrors the brand bible §07 (accent) and §12
 *    (allocation, anchor, guest material).
 *  - Collection + static page handles mirror `docs/routing.md`.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Product = {
  /** Storefront handle. `manifest-` prefix stripped per `docs/routing.md`. */
  readonly handle: string;
  /** Shopify product handle as stored in the live store. */
  readonly shopifyHandle: string;
  /** Display title (e.g. "Tech Pouch · M"). */
  readonly title: string;
  /** Price in EUR. Authoritative price still comes from Shopify; this is the catalogue default. */
  readonly priceEur: number;
  /** Internal volume label (e.g. "1.4L"). `—` where not applicable. */
  readonly volume: string;
  /** Quartermaster description used by the desk recommender. */
  readonly use: string;
  /** Dossier ordinal — drives the "DOSSIER 04" copy on PDP. */
  readonly dossierNumber: number;
};

export type CollectionHandle = 'edition-01' | 'all' | 'cubes' | 'pouches' | 'hardware';

export type Collection = {
  readonly handle: CollectionHandle;
  readonly title: string;
  readonly summary: string;
  /** Storefront handles of the products in this collection, in display order. */
  readonly productHandles: readonly string[];
};

export type StaticPageHandle = 'editions' | 'system' | 'provenance';

export type StaticPage = {
  readonly handle: StaticPageHandle;
  readonly title: string;
  readonly description: string;
};

export type EditionMetadata = {
  readonly number: string;
  readonly anchor: string;
  readonly coordinates: string;
  readonly accentName: string;
  readonly accentHex: string;
  readonly guestMaterial: string;
  readonly totalAllocation: number;
  readonly issuedFrom: string;
  readonly shipsBy: string;
  readonly shipLeadDays: number;
};

// ---------------------------------------------------------------------------
// Edition 01 products
// ---------------------------------------------------------------------------

export const EDITION_01_PRODUCTS: readonly Product[] = [
  {
    handle: 'field-tote',
    shopifyHandle: 'manifest-field-tote',
    title: 'Field Tote',
    priceEur: 118,
    volume: '14L',
    use: 'top carry, the hub of the system',
    dossierNumber: 1,
  },
  {
    handle: 'cube-s',
    shopifyHandle: 'manifest-cube-s',
    title: 'Cube · S',
    priceEur: 38,
    volume: '0.8L',
    use: 'small clothing, knit, socks',
    dossierNumber: 2,
  },
  {
    handle: 'cube-m',
    shopifyHandle: 'manifest-cube-m',
    title: 'Cube · M',
    priceEur: 48,
    volume: '1.4L',
    use: 'shirts, layers',
    dossierNumber: 3,
  },
  {
    handle: 'cube-l',
    shopifyHandle: 'manifest-cube-l',
    title: 'Cube · L',
    priceEur: 58,
    volume: '2.2L',
    use: 'trousers, shoes, outerwear',
    dossierNumber: 4,
  },
  {
    handle: 'tech-pouch-s',
    shopifyHandle: 'manifest-tech-pouch-s',
    title: 'Tech Pouch · S',
    priceEur: 98,
    volume: '0.8L',
    use: 'documents, passport, paperback',
    dossierNumber: 5,
  },
  {
    handle: 'tech-pouch-m',
    shopifyHandle: 'manifest-tech-pouch-m',
    title: 'Tech Pouch · M',
    priceEur: 128,
    volume: '1.4L',
    use: 'cables, dongles, USB-C, small tech',
    dossierNumber: 6,
  },
  {
    handle: 'tech-pouch-l',
    shopifyHandle: 'manifest-tech-pouch-l',
    title: 'Tech Pouch · L',
    priceEur: 148,
    volume: '2.2L',
    use: 'laptop power, full tech kit',
    dossierNumber: 7,
  },
  {
    handle: 'toiletry-kit',
    shopifyHandle: 'manifest-toiletry-kit',
    title: 'Toiletry Kit',
    priceEur: 68,
    volume: '0.9L',
    use: 'TSA-legal toiletries, sealed',
    dossierNumber: 8,
  },
  {
    handle: 'luggage-tag',
    shopifyHandle: 'manifest-luggage-tag',
    title: 'Luggage Tag',
    priceEur: 8,
    volume: '—',
    use: 'anodized AL with etched issue number',
    dossierNumber: 9,
  },
  {
    handle: 'anchor-latch',
    shopifyHandle: 'manifest-anchor-latch',
    title: 'Anchor Latch',
    priceEur: 28,
    volume: '—',
    use: 'spare hardware, MO-A1 single',
    dossierNumber: 10,
  },
] as const;

// ---------------------------------------------------------------------------
// Edition 01 metadata
// ---------------------------------------------------------------------------

export const EDITION_01: EditionMetadata = {
  number: '01',
  anchor: 'Strait of Gibraltar',
  coordinates: "36°08'N 5°21'W",
  accentName: 'Signal Orange',
  accentHex: '#D24A1F',
  guestMaterial: 'Hypalon reinforcement',
  totalAllocation: 1200,
  issuedFrom: 'Porto',
  shipsBy: '2026-Q2',
  shipLeadDays: 5,
} as const;

// ---------------------------------------------------------------------------
// Collections (`docs/routing.md` §Static handles)
// ---------------------------------------------------------------------------

const ALL_HANDLES: readonly string[] = EDITION_01_PRODUCTS.map((product) => product.handle);
const CUBE_HANDLES: readonly string[] = ['cube-s', 'cube-m', 'cube-l'];
const POUCH_HANDLES: readonly string[] = ['tech-pouch-s', 'tech-pouch-m', 'tech-pouch-l'];
const HARDWARE_HANDLES: readonly string[] = ['anchor-latch', 'luggage-tag'];

export const COLLECTIONS: readonly Collection[] = [
  {
    handle: 'edition-01',
    title: 'Edition 01 — Gibraltar',
    summary:
      'Ten dossiers, 1,200 systems, finished in Porto. Anchored to the Strait of Gibraltar at 36°08′N 5°21′W.',
    productHandles: ALL_HANDLES,
  },
  {
    handle: 'all',
    title: 'All Dossiers',
    summary: 'Every dossier across every Edition currently issued.',
    productHandles: ALL_HANDLES,
  },
  {
    handle: 'cubes',
    title: 'Cubes',
    summary: 'Three sizes. Clothing, layers, outerwear.',
    productHandles: CUBE_HANDLES,
  },
  {
    handle: 'pouches',
    title: 'Tech Pouches',
    summary: 'Three sizes. Documents through full laptop kit.',
    productHandles: POUCH_HANDLES,
  },
  {
    handle: 'hardware',
    title: 'Hardware',
    summary: 'The Anchor Latch and the etched Luggage Tag. Spare and replacement parts.',
    productHandles: HARDWARE_HANDLES,
  },
] as const;

// ---------------------------------------------------------------------------
// Static pages (`docs/routing.md` §Static handles)
// ---------------------------------------------------------------------------

export const STATIC_PAGES: readonly StaticPage[] = [
  {
    handle: 'editions',
    title: 'The Editions',
    description:
      'Editions are geographic projects, not seasonal drops. Each is anchored to a place, finite by allocation, and authored.',
  },
  {
    handle: 'system',
    title: 'The Anchor Latch System',
    description:
      'One closure. Every component. The system holds. Mechanical detail, cycle test results, tolerance budget.',
  },
  {
    handle: 'provenance',
    title: 'Provenance & Practitioners',
    description:
      'Issued from Porto, finished by Atelier Souto in Vila Nova de Famalicão. The makers, the materials, the QC standard.',
  },
] as const;

// ---------------------------------------------------------------------------
// Convenience lookups
// ---------------------------------------------------------------------------

/** Find a product by its storefront handle (no `manifest-` prefix). */
export function findProductByHandle(handle: string): Product | undefined {
  return EDITION_01_PRODUCTS.find((product) => product.handle === handle);
}

/** Find a product by its Shopify handle (with `manifest-` prefix). */
export function findProductByShopifyHandle(shopifyHandle: string): Product | undefined {
  return EDITION_01_PRODUCTS.find((product) => product.shopifyHandle === shopifyHandle);
}

/** Find a collection by handle. */
export function findCollectionByHandle(handle: string): Collection | undefined {
  return COLLECTIONS.find((collection) => collection.handle === handle);
}

/** Find a static page by handle. */
export function findStaticPageByHandle(handle: string): StaticPage | undefined {
  return STATIC_PAGES.find((page) => page.handle === handle);
}

// ---------------------------------------------------------------------------
// Legacy export shims — preserve the placeholder API so Agent A's in-flight
// imports keep resolving while Wave-2 routes adopt the new names.
// ---------------------------------------------------------------------------

/** Legacy shape (Shopify handle keyed). Prefer `Product` going forward. */
export type ProductCatalogEntry = {
  readonly handle: string;
  readonly title: string;
  readonly price: number;
  readonly volume: string;
  readonly use: string;
};

/** Legacy export. Prefer `EDITION_01_PRODUCTS` for new code. */
export const EDITION_01_CATALOG: readonly ProductCatalogEntry[] = EDITION_01_PRODUCTS.map(
  (product) => ({
    handle: product.shopifyHandle,
    title: product.title,
    price: product.priceEur,
    volume: product.volume,
    use: product.use,
  }),
);

/** Legacy export — Shopify handles, in catalogue order. */
export const EDITION_01_HANDLES: readonly string[] = EDITION_01_PRODUCTS.map(
  (product) => product.shopifyHandle,
);

/** Legacy lookup — accepts a Shopify handle (with `manifest-` prefix). */
export function findCatalogEntry(shopifyHandle: string): ProductCatalogEntry | undefined {
  return EDITION_01_CATALOG.find((entry) => entry.handle === shopifyHandle);
}
