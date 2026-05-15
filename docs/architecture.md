# Architecture

This repo follows the **universal slice** of the
[Maelify Development Framework](https://github.com/maelify/framework) — the
principles that apply to any TypeScript / React product. The framework was
originally written for **Shopify embedded admin apps** (Remix + Polaris + Prisma

- multi-tenant RLS). This repo is a different shape — a **public-facing headless
  storefront for a single Shopify store** — so some of the framework does not
  apply. The deviations are explicit and documented here, not silent.

## Layer separation

Every piece of code has exactly one home. If code is in the wrong layer it gets
rejected during review, no matter how well it works.

| Layer          | Location                                                 | Does                                             | Does NOT                               |
| -------------- | -------------------------------------------------------- | ------------------------------------------------ | -------------------------------------- |
| **Routes**     | `src/app/**/route.ts`, `src/app/**/page.tsx`             | Wire HTTP → service / page → component           | Contain logic, types, queries, utils   |
| **Services**   | `src/lib/services/`                                      | Orchestrate business logic across data sources   | Contain raw queries, direct API access |
| **Shopify**    | `src/lib/shopify/queries/`, `src/lib/shopify/mutations/` | Call Shopify Admin GraphQL                       | Contain business logic, DB queries     |
| **Klaviyo**    | `src/lib/klaviyo/`                                       | Call Klaviyo Events / Profiles API               | Contain business logic, route wiring   |
| **Gemini**     | `src/lib/gemini/`                                        | Call Google Generative AI                        | Contain business logic                 |
| **Security**   | `src/lib/security/`                                      | Rate limiting, CORS, Turnstile, input validation | Contain business logic                 |
| **Models**     | `src/lib/models/`                                        | Data-access (when a DB is added)                 | Contain business logic, API calls      |
| **Types**      | `src/lib/types/`                                         | TypeScript interfaces and type aliases           | Contain runtime logic                  |
| **Constants**  | `src/lib/constants/`                                     | Static values (prices, thresholds, regex)        | Contain logic                          |
| **Utils**      | `src/lib/utils/`                                         | Pure helper functions                            | Contain business logic, side effects   |
| **Hooks**      | `src/hooks/`                                             | Client-side state                                | Call APIs directly                     |
| **Components** | `src/components/{ui,layout,sections}/`                   | Render UI from props                             | Fetch data, contain business logic     |
| **Content**    | `src/content/`                                           | Static content as data (product catalog, copy)   | Contain logic                          |

### Routes are thin

A `route.ts` is a wiring layer, not a logic layer. If a route file contains a
GraphQL string, a Prisma query, a type alias, or a utility function — it
belongs somewhere else.

```ts
// Right: route delegates to service
export async function POST(request: Request): Promise<Response> {
  const body = await parseReserveRequest(request);
  const result = await reserveProduct(body);
  return Response.json(result);
}
```

### Services orchestrate, never query

A service composes multiple `lib/shopify/`, `lib/klaviyo/`, and `lib/models/`
calls. It never contains a raw GraphQL string or SQL.

### GraphQL strings live inside the function that calls them

This is rule §3 of the framework. Verbatim from the spec: _if a GraphQL query
is exported as a module-level constant, it gets rejected_. ESLint flags this
via `no-restricted-syntax`.

```ts
// Right
export async function fetchProductsByHandle(handles: string[]): Promise<Product[]> {
  const query = `#graphql
    query GetProducts($handles: [String!]!) { ... }
  `;
  const response = await adminGraphql(query, { variables: { handles } });
  // ...
}
```

## TypeScript discipline

- **Zero `any`**. The ESLint rule is `error`, not `warn`. Trace `any` to its
  source — fix at the producer, not the consumer.
- **Explicit return types** on every exported function (warned by
  `explicit-module-boundary-types`).
- **`unknown` + type guard** for truly unknown data — never `any`.
- `JSON.parse` and `Response.json()` results must be immediately typed.
- `tsconfig.json` enables `strict`, `noUncheckedIndexedAccess`,
  `noImplicitOverride`, `noFallthroughCasesInSwitch`.

## Naming

- Self-documenting variable names. Never `q`, `d`, `res`, `val`, `tmp`. Always
  `searchQuery`, `deliveryDate`, `locationResponse`, `discountValue`. Include
  the entity (`productNumericId`, not `numericId`).
- `id-length` ESLint rule is `error` with the standard math-index exceptions
  (`i`, `j`, `k`, `x`, `y`, `z`) plus `t` for i18n.

## SonarQube parity

Enforced via `eslint-plugin-sonarjs` + custom rules:

| Rule                 | Do                       | Don't                             |
| -------------------- | ------------------------ | --------------------------------- |
| Parse                | `Number.parseInt(x, 10)` | `parseInt(x)` (radix rule)        |
| Set lookup           | `new Set([...]).has(x)`  | `[...].includes(x)` (review only) |
| Equality             | `===`                    | `==` (eqeqeq)                     |
| Mutability           | `const`                  | `var` (prefer-const, no-var)      |
| Cognitive complexity | < 15 per function        | 15+ (sonarjs warn)                |
| Duplicate strings    | extract at 4 occurrences | inline 4+ times                   |
| Identical functions  | extract to utils         | duplicate (sonarjs error)         |
| Module-level GraphQL | inside function          | top-level const (custom rule)     |

## Pre-commit gate

`husky` + `lint-staged`. On every commit:

1. `tsc --noEmit` — zero new errors
2. `eslint --fix` on changed `.ts` / `.tsx`
3. `prettier --write` on changed `.json` / `.md` / `.css`

A commit cannot land with TypeScript errors or ESLint errors. Warnings are
allowed but visible.

## What the Maelify framework prescribes that this repo does NOT use, and why

The full framework is written for **Shopify embedded admin apps**. This repo is
a **public-facing headless storefront**. The following framework sections are
deliberately out of scope here:

| Framework section                                        | Out of scope because                                                                                                                                                                                                                            |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **§4 Multi-tenant RLS with `withTenant()`**              | Single-store demo, no shared-database tenancy model. If a DB is added for cart persistence, the storefront's "tenant" is the visitor session, not a merchant.                                                                                   |
| **§4 Prisma + Postgres migrations**                      | No DB in current scope. The cart is `sessionStorage`. Allocation lives in Shopify metafields. When a DB is added (e.g., for email capture, draft manifests), revisit.                                                                           |
| **§6 Polaris `s-*` components**                          | Polaris is for the Shopify admin embedded experience. Using Polaris on a brand storefront would visually clash with the merchant's identity. This storefront uses Tailwind 4 + a custom design system.                                          |
| **§6 i18n in en.json + es.json**                         | Storefront is single-language for the demo. Future work — flag tracked in [docs/roadmap.md](./roadmap.md).                                                                                                                                      |
| **§9 AWS Secrets Manager + Lambda + DynamoDB + CDK**     | This repo deploys to Vercel. Equivalent practice: Vercel environment variables fetched via `vercel env pull → .env.local`. No secrets in source.                                                                                                |
| **§11 Webhook HMAC verification**                        | No webhook routes in current scope. If we add webhook receivers (e.g., `orders/create` for cart-to-CRM sync), the framework's webhook section applies verbatim — HMAC-SHA256 with timing-safe comparison, app client secret, HTTP API not REST. |
| **§12 Multi-channel alerting + DLQ + distributed locks** | Storefront has no batch sync jobs to monitor. Vercel Logs + a single Slack/Telegram channel suffice.                                                                                                                                            |

## Implementation order (when adding a new feature)

Adapted from framework §8 for the storefront shape:

```
1. Types + Constants (src/lib/types/, src/lib/constants/)
2. Shopify / Klaviyo / Gemini integration (src/lib/<vendor>/)
3. Service layer (src/lib/services/) — orchestration
4. Hook (src/hooks/) — client state if needed
5. Component (src/components/) — UI pieces
6. Route (src/app/.../route.ts or page.tsx) — HTTP wiring
7. (deferred) i18n keys when bilingual is added
8. Test on demo.maelify.com (preview deploy)
9. SonarLint / pnpm lint / pnpm typecheck must pass
10. PR — squash-merge to `main` (single-author project)
```

## File path conventions

- All app code lives under `src/`.
- Import alias `@/*` resolves to `src/*` (configured in `tsconfig.json`).
- Server-only modules use the `*.server.ts` suffix when they share a directory
  with client code (Next.js convention reinforced).
- Generated files use a `*.generated.ts` suffix and are ignored by ESLint.

## Observability (`data-track` + GA4 + GTM)

The repo ships a single typed `track()` helper (`src/lib/analytics/track.ts`)
that pushes a normalised envelope to `window.dataLayer` and optionally
fans out to Klaviyo. GTM container `GTM-5HMML5DX` forwards every event to
GA4 `G-S63PX9NHSS` with full param mapping. Full taxonomy + setup runbook
in [`docs/analytics-setup.md`](./analytics-setup.md).

There are two ways to instrument an element:

**Declarative — `data-track` attribute** (default for static UI):

```tsx
<button data-track="newsletter_signup" data-track-position="hero">
  Subscribe
</button>
```

A single delegated `click` listener (`AutoClickTracker.tsx`) walks up from
the click target, finds the nearest `[data-track]` ancestor, and emits an
`element_click` event with `label = data-track` value. Every additional
`data-track-*` attribute is forwarded as an event parameter
(`data-track-position="hero"` → `position: "hero"`). Adding a tracked
element is a one-attribute change in JSX — no imports, no hook wiring.

**Imperative — `track(eventName, options)`** (for state changes and async
results that have no DOM origin):

```ts
import { CUSTOM_EVENTS, track } from '@/lib/analytics';

track(CUSTOM_EVENTS.reserveClick, {
  params: { handle, price },
  ecommerce: { currency: 'EUR', value: price, items: [{ ... }] },
  fanout: { klaviyo: true },
});
```

The `CUSTOM_EVENTS` and `ECOMMERCE_EVENTS` const objects in
`src/lib/analytics/types.ts` are the single source of truth for event
names. The GTM trigger regex must mirror them; a new event name without a
trigger update will fire into the dataLayer but never reach GA4.

### What we measure that is non-obvious

- **`section_view` + `section_dwell`** via `<SectionView name="...">` so we
  can answer "what did people actually see?" not just "what's on the page?".
- **`rage_click` + `dead_click`** for frustration signals (3 clicks <800ms
  on same target, and clicks that landed on non-interactive elements).
- **`viewer_3d_rotate` / `_explode` / `_assemble`** with `source: auto |
user` so the IntersectionObserver auto-trigger doesn't inflate the
  intentional-toggle counts.
- **`scroll_pin_panel`** on integer panel-index crossings only; hysteresis
  falls out for free without an extra ref.

## Security posture

See [`SECURITY.md`](./SECURITY.md) for the full policy. Headlines:

- **Secrets** live in Vercel environment variables only. Pull with
  `vercel env pull .env.local` for local development.
- **`.env*`** is gitignored at every depth. `.env.example` is the only
  committable template.
- **Internal IDs** (Shopify product GIDs, Vercel project IDs) are sourced from
  env or constants — not hardcoded in setup scripts.
- **PII redaction** in any log output: `jo***@domain.com` patterns.
- **HTTPS enforcement** for any external URL the server fetches (images,
  webhooks, integrations).
