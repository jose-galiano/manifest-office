# `src/lib/services/` — Business logic orchestration

**Rule:** orchestrate, never query.

A service composes multiple `lib/shopify/`, `lib/klaviyo/`, `lib/gemini/`, or
`lib/models/` calls. It never contains a raw GraphQL string or DB query.

Example: `reserveProduct.ts` calls `incrementAllocationMetafield()` (shopify),
`decrementVariantInventory()` (shopify), `trackEvent()` (klaviyo) — combines
the results into a typed `ReserveResult`.
