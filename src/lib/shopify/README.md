# `src/lib/shopify/` — Shopify Admin GraphQL layer

**Rule:** call Shopify Admin GraphQL. Nothing else.

- GraphQL strings live INSIDE the function that executes them (Maelify §3).
- No business logic. Compose multiple shopify calls in `src/lib/services/`.
- Queries → `queries/`. Mutations → `mutations/`.
- Each function has an explicit `Promise<TypedResponse>` return type.
- The Admin token comes from `process.env.SHOPIFY_ADMIN_API_TOKEN` (Vercel env).
