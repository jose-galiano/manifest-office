# Routing

This storefront follows **canonical Shopify theme URL conventions** so it
reads as a real commerce site, not a bespoke single-page app. URLs match
what Shopify's `routes` Liquid object would produce on a native theme.

The brand voice (calling products "dossiers" and collections "editions") is
preserved in copy and UI — but **the URL structure is canonical**. Recruiters
and Shopify-world reviewers should be able to predict every URL without
reading the code.

## Canonical Shopify routes (the rule)

| Pattern                                         | Liquid name                          | Purpose                                                       |
| ----------------------------------------------- | ------------------------------------ | ------------------------------------------------------------- |
| `/`                                             | `routes.root_url`                    | Homepage                                                      |
| `/products/:handle`                             | `routes.product_url`                 | Single product (PDP)                                          |
| `/collections/:handle`                          | `routes.collection_url`              | Collection page                                               |
| `/collections/all`                              | `routes.all_products_collection_url` | All products                                                  |
| `/collections/:handle/products/:product-handle` | scoped product                       | Product viewed in collection context                          |
| `/collections/:handle/:tag`                     | tag-filtered collection              | Collection filtered by tag                                    |
| `/blogs/:blog-handle`                           | `routes.blog_url`                    | Blog index (plural `blogs`, always)                           |
| `/blogs/:blog-handle/:article-handle`           | `routes.article_url`                 | Single article                                                |
| `/pages/:handle`                                | `routes.page_url`                    | Static content page                                           |
| `/cart`                                         | `routes.cart_url`                    | Cart page (full review)                                       |
| `/search?q=...`                                 | `routes.search_url`                  | Search results                                                |
| `/account*`                                     | `routes.account_*`                   | Customer account routes (out of scope for the demo, reserved) |

## Route map — legacy → Next.js (Shopify-canonical)

| Legacy URL (`deploy/`) | Next.js route (`src/app/`)               | Implementation                                                         |
| ---------------------- | ---------------------------------------- | ---------------------------------------------------------------------- |
| `/`                    | `/`                                      | `src/app/page.tsx`                                                     |
| `/dossiers`            | **`/collections/edition-01`**            | `src/app/collections/[handle]/page.tsx`                                |
| `/dossiers/[handle]`   | **`/products/[handle]`**                 | `src/app/products/[handle]/page.tsx`                                   |
| `/pdp?handle=...`      | `/products/[handle]` (canonical)         | folded in                                                              |
| `/collection`          | `/collections/all` (301 redirect)        | redirect rule                                                          |
| `/editions`            | **`/pages/editions`**                    | `src/app/pages/[handle]/page.tsx`                                      |
| `/editions/01`         | `/collections/edition-01` (301 redirect) | redirect rule — Edition 01 IS the collection                           |
| `/system`              | **`/pages/system`**                      | `src/app/pages/[handle]/page.tsx`                                      |
| `/provenance`          | **`/pages/provenance`**                  | `src/app/pages/[handle]/page.tsx`                                      |
| (new)                  | `/blogs/operator-notes`                  | `src/app/blogs/[blog]/page.tsx` (placeholder for now)                  |
| (new)                  | `/blogs/operator-notes/:article`         | `src/app/blogs/[blog]/[article]/page.tsx`                              |
| (new)                  | `/cart`                                  | `src/app/cart/page.tsx` (full-page review; drawer stays for quick-add) |
| (new)                  | `/search`                                | `src/app/search/page.tsx`                                              |

## Why "Edition 01" is a collection, not a page

Each Edition is a curated drop of 10 SKUs with a fixed allocation. Conceptually
this is **exactly** what a Shopify collection is — a set of products grouped by
intent. Mapping it to `/collections/edition-01` means:

- The collection page can use Shopify's native ordering, tag-filtering, and
  metafield surfaces.
- If you ever migrate to a Shopify-hosted theme, the URLs work as-is.
- SEO/canonical URLs match how Google indexes commerce sites.
- The "Editions" narrative page (`/pages/editions`) becomes the _story_ about
  Editions; the _products_ live in collections.

## Folder structure (Next.js App Router)

```
src/app/
├── page.tsx                              → /
├── products/
│   └── [handle]/
│       └── page.tsx                      → /products/:handle
├── collections/
│   ├── page.tsx                          → /collections (lists all collections)
│   └── [handle]/
│       ├── page.tsx                      → /collections/:handle
│       └── products/
│           └── [product]/
│               └── page.tsx              → /collections/:handle/products/:product
├── blogs/
│   └── [blog]/
│       ├── page.tsx                      → /blogs/:blog
│       └── [article]/
│           └── page.tsx                  → /blogs/:blog/:article
├── pages/
│   └── [handle]/
│       └── page.tsx                      → /pages/:handle
├── cart/
│   └── page.tsx                          → /cart
├── search/
│   └── page.tsx                          → /search
└── api/
    ├── products/route.ts
    ├── reserve/route.ts
    ├── desk/route.ts
    ├── track/route.ts
    └── config/route.ts
```

## Static handles (Wave 2 source of truth)

These handles drive the dynamic `[handle]` segments. They live in
`src/content/manifest-office.ts` as a typed constant so they're not duplicated
across `lib/shopify/`, `lib/services/`, and pages.

### `/pages/:handle`

| Handle       | Title                       | Source                     |
| ------------ | --------------------------- | -------------------------- |
| `editions`   | The Editions                | content/manifest-office.ts |
| `system`     | The Anchor Latch System     | content/manifest-office.ts |
| `provenance` | Provenance & Practitioners  | content/manifest-office.ts |
| `materials`  | Materials & Origin (future) | reserved                   |
| `repair`     | Repair & Lifetime (future)  | reserved                   |

### `/collections/:handle`

| Handle       | Title                  | Notes                      |
| ------------ | ---------------------- | -------------------------- |
| `edition-01` | Edition 01 — Gibraltar | 10 SKUs, 1200 allocation   |
| `all`        | All Dossiers           | every SKU across editions  |
| `cubes`      | Cubes                  | the 3 cube sizes (S/M/L)   |
| `pouches`    | Tech Pouches           | the 3 pouch sizes (S/M/L)  |
| `hardware`   | Hardware               | Anchor Latch + Luggage Tag |

### `/blogs/:blog-handle`

| Handle           | Title          | Notes                      |
| ---------------- | -------------- | -------------------------- |
| `operator-notes` | Operator Notes | The default editorial blog |

## 301 redirects (Vercel config)

Legacy URLs must 301 to canonical Shopify forms so existing inbound links and
SEO keep working. Configured in `next.config.ts` via `redirects()`:

```ts
async redirects() {
  return [
    { source: '/dossiers',                permanent: true, destination: '/collections/edition-01' },
    { source: '/dossiers/:handle',        permanent: true, destination: '/products/manifest-:handle' },
    { source: '/pdp',                     permanent: true, destination: '/collections/edition-01' },
    { source: '/collection',              permanent: true, destination: '/collections/all' },
    { source: '/editions',                permanent: true, destination: '/pages/editions' },
    { source: '/editions/01',             permanent: true, destination: '/collections/edition-01' },
    { source: '/system',                  permanent: true, destination: '/pages/system' },
    { source: '/provenance',              permanent: true, destination: '/pages/provenance' },
  ];
}
```

## Product handle policy

Shopify product handles in the live store are `manifest-field-tote`,
`manifest-cube-s`, etc. The `manifest-` prefix is a relic of having multiple
brands in one dev store. Two options for the Next.js storefront:

1. **Keep the prefix** in URLs: `/products/manifest-field-tote`. Lossless. Less
   pretty.
2. **Strip the prefix** at the route level: `/products/field-tote` → resolves
   to Shopify handle `manifest-field-tote` via a single mapping function in
   `lib/shopify/handle.ts`. Prettier URLs, one extra hop.

**Decision:** strip the prefix for storefront URLs (#2). The mapping function
is the only place that knows about the Shopify handle convention, isolating
the dependency.

```ts
// src/lib/shopify/handle.ts
export function toShopifyHandle(storefrontHandle: string): string {
  return `manifest-${storefrontHandle}`;
}
export function toStorefrontHandle(shopifyHandle: string): string {
  return shopifyHandle.replace(/^manifest-/, '');
}
```

## Out of scope for the demo

- Customer account routes (`/account`, `/account/login`, etc.) — not built.
  The space is reserved so the route table can grow without breaking
  conventions.
- Cart `add` / `change` / `clear` POST endpoints (`routes.cart_add_url`,
  etc.) — Shopify themes use these for form submission; we use a typed JSON
  API at `/api/reserve` instead because the Pause-and-Build plan blocks real
  checkout.
- Localised paths (`/en-us/products/:handle`) — single-language for now.
