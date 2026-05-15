# Manifest Office

A headless Shopify storefront for a fictional travel-kit brand (Edition 01 —
1,200 systems issued from Porto). Built as a portfolio piece by
[Maelify](https://maelify.com) to demonstrate how a Shopify Plus storefront
can be shipped with measured discipline: strict TypeScript, sealed API
defenses, agentic-commerce readiness, and observability that goes beyond
"GA4 worked once".

**Live:** [demo.maelify.com](https://demo.maelify.com)

![Next.js 15](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![TypeScript strict](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![React 19](https://img.shields.io/badge/React-19-149ECA?logo=react)
![Tailwind 4](https://img.shields.io/badge/Tailwind-4-38BDF8?logo=tailwindcss&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-r184-000000?logo=three.js)
![Shopify Admin GraphQL](https://img.shields.io/badge/Shopify-Admin%20GraphQL-7AB55C?logo=shopify&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-edge-black?logo=vercel)
![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)

## 60-second pitch

Most "headless Shopify" portfolios are a hero, a PDP, and a contact form.
This one ships:

- **Real Shopify integration** — 10 active products on a live store, the
  PLP and PDP both hit Shopify Admin GraphQL, the Reserve button writes an
  `allocation_issued` metafield through a server action, and the count on
  the page is the live count.
- **A 7-layer-defended Gemini endpoint** (`/api/desk`) — origin allowlist,
  honeypot, Turnstile, input validation, rate limiting, response cache,
  then the AI call. Every layer is labelled in code (`SECURITY.md` has the
  full breakdown).
- **Agentic commerce surface** — `/llms.txt` and `/llms-full.txt` route
  handlers expose a structured catalogue specifically for LLMs. robots.txt
  explicitly allows AI bots. Same content is the source of truth for the
  human storefront and the machine one.
- **WebGL + 3D** — homepage hero is a custom shader-driven topographic
  wireframe of the Strait of Gibraltar with cursor-elastic deformation.
  PDP has a drag-rotatable, exploded-view 3D viewer for a 7-piece kit.
- **Observability that pays its way** — `data-track` attribute auto-binds
  click tracking, IntersectionObserver wrapper measures section dwell time,
  rage clicks and dead clicks are flagged, viewer interactions distinguish
  user-triggered from auto-triggered, scroll-pin panel transitions emit on
  integer crossings only.
- **TypeScript discipline** enforced at the lint level: zero `any`,
  `id-length` error, cognitive complexity capped, no module-level GraphQL,
  Husky + lint-staged gate every commit.

The code-to-feature ratio is high. The framework
([Maelify Development Framework](./docs/architecture.md)) is enforced, not
aspirational.

## Stack

| Layer        | Choice                                  |
| ------------ | --------------------------------------- |
| Framework    | Next.js 15.5 (App Router, Turbopack)    |
| UI           | React 19, Tailwind CSS 4 (`@theme`)     |
| Language     | TypeScript 5 (strict + uncheckedIndex…) |
| 3D / shaders | Three.js r184                           |
| State        | Zustand (cart) + sessionStorage         |
| Runtime      | Node 22 LTS, pnpm 11                    |
| Commerce     | Shopify Admin GraphQL (`2025-10`)       |
| AI           | Google Gemini 2.5                       |
| CRM          | Klaviyo Events + Profiles API           |
| Edge         | Vercel, Upstash Redis (rate / cache)    |
| Analytics    | GA4 + GTM + Consent Mode v2             |
| Quality      | ESLint, Prettier, Husky, sonarjs        |

## Quickstart

```bash
git clone <repo>
cd manifest-office
pnpm install

# Pull env from Vercel (recommended) or copy .env.example → .env.local
vercel env pull .env.local

pnpm dev          # Turbopack dev server on :3000
pnpm typecheck    # tsc --noEmit
pnpm lint         # ESLint, max-warnings=0
pnpm build        # Production build
```

Requires Node 22+ (see `engines` in `package.json`). All env vars are
documented in `.env.example` and listed in
[`docs/analytics-setup.md`](./docs/analytics-setup.md) (analytics) and
[`docs/SECURITY.md`](./docs/SECURITY.md) (everything else).

## Architecture in 60 seconds

```
src/
├── app/                       Routes (App Router). Thin: HTTP wiring only.
│   ├── api/
│   │   ├── desk/route.ts      7-layer-defended Gemini endpoint
│   │   ├── reserve/route.ts   Allocation metafield write (server action)
│   │   ├── track/route.ts     Klaviyo event ingest
│   │   └── products/route.ts  Live Shopify Admin GraphQL feed
│   ├── (storefront pages)     /, /collections, /products/[handle], …
│   ├── llms.txt + llms-full.txt   Agentic-commerce route handlers
│   ├── error.tsx              Route-level error boundary (branded)
│   └── global-error.tsx       Top-level catch-all (no design-system deps)
├── components/
│   ├── ui/                    Atomic primitives (Eyebrow, MonoCaption, …)
│   ├── layout/                Nav, Footer, CartDrawer, ConsoleSignature
│   ├── sections/              Page sections (HomeHero, PdpBuybox, …)
│   └── analytics/             GTM, ConsentBanner, trackers
├── lib/
│   ├── analytics/             `track()` helper, types, identity, consent
│   ├── shopify/               Admin GraphQL client + queries
│   ├── klaviyo/               Events + Profiles API
│   ├── gemini/                Google Generative AI client
│   ├── security/              Rate limiting, Turnstile, origin allowlist
│   ├── services/              Orchestration (no raw queries)
│   ├── seo/                   JSON-LD, OpenGraph, llms.txt builders
│   ├── three/                 Exploded-scene geometry + tween logic
│   ├── state/cart.ts          Zustand cart (sessionStorage persisted)
│   ├── types/                 Shared TS types
│   ├── constants/             Commerce + security tunables
│   └── utils/                 Pure helpers
├── content/manifest-office.ts Product catalog + brand copy (SSoT)
└── hooks/use-cart.ts          Component-facing cart surface
```

Layer separation is enforced by ESLint (e.g. components can't import from
`lib/state/` directly — they go through `hooks/`). Full rules in
[`docs/architecture.md`](./docs/architecture.md).

## Highlights

### `/api/desk` — 7-layer-defended Gemini endpoint

Public AI endpoints are catnip for abuse. This one runs every request
through seven labelled layers before any paid call hits Gemini:

```
C  origin allowlist  →  E  honeypot  →  D  zod validation  →
F  Turnstile  →  B  rate limit  →  G  response cache  →  Z  Gemini
```

Walk through `src/app/api/desk/route.ts` — every layer is commented with
its letter. The cache makes a viral share free; the rate limit means a
botnet costs nothing; the validation makes prompt-injection a non-event.
Full doc: [`docs/SECURITY.md`](./docs/SECURITY.md).

### Agentic-commerce SEO

`/llms.txt` (compact) and `/llms-full.txt` (rich) expose the product
catalogue in a format LLMs can consume directly:

```
GET https://demo.maelify.com/llms.txt
GET https://demo.maelify.com/llms-full.txt
```

`robots.txt` explicitly allows AI crawlers. The content is generated from
`src/content/manifest-office.ts` — same source the human storefront reads,
so the AI version can never drift from what shoppers see.

### Observability that earns its weight

A single `track()` helper writes to a typed dataLayer envelope (session
id, anonymous id, page path, timestamp, plus event params + GA4
ecommerce). GTM forwards every event to GA4 with full param mapping. The
event vocabulary measures things most demos don't:

- `section_view` + `section_dwell` (what did people see, for how long?)
- `viewer_3d_rotate` with `duration_ms` + `distance_px` + direction
- `viewer_3d_explode|assemble` with `source: auto | user` so the
  IntersectionObserver auto-trigger doesn't inflate intentional counts
- `scroll_pin_panel` on integer crossings only (hysteresis for free)
- `rage_click` + `dead_click` for frustration signals
- GA4-canonical `view_item` / `add_to_cart` / `view_cart` / `generate_lead`

Add a tracked element with a one-attribute change:

```tsx
<button data-track="newsletter_signup" data-track-position="hero">
  …
</button>
```

Setup runbook + full event taxonomy:
[`docs/analytics-setup.md`](./docs/analytics-setup.md).

## Scripts

| Script              | Purpose                             |
| ------------------- | ----------------------------------- |
| `pnpm dev`          | Start the dev server with Turbopack |
| `pnpm build`        | Production build                    |
| `pnpm start`        | Serve the production build          |
| `pnpm lint`         | ESLint, `--max-warnings=0`          |
| `pnpm lint:fix`     | ESLint with auto-fix                |
| `pnpm typecheck`    | `tsc --noEmit`                      |
| `pnpm format`       | Prettier on the repo                |
| `pnpm format:check` | Verify formatting without writing   |

## CI

GitHub Actions runs on every push to `main` and every PR:
`pnpm install --frozen-lockfile` → `typecheck` → `lint` → `format:check`
→ `build`. See [`.github/workflows/ci.yml`](./.github/workflows/ci.yml).

A Husky `pre-commit` hook runs ESLint (`--max-warnings=0`) and Prettier on
staged files before any commit. A commit with type errors or lint errors
cannot land.

## Deployment

Target: **Vercel**. The project is `manifest-office-next` under the
`tmsjoses-projects` team. Custom domain `demo.maelify.com` is a CNAME on
GoDaddy → `cname.vercel-dns.com`.

```bash
vercel deploy --prod --yes
```

Required Vercel env vars (set at Production scope):

| Variable                   | Purpose                          |
| -------------------------- | -------------------------------- |
| `SHOPIFY_STORE`            | `<shop>.myshopify.com`           |
| `SHOPIFY_ADMIN_API_TOKEN`  | Custom App Admin API access      |
| `KLAVIYO_PRIVATE_API_KEY`  | Server-side event POSTs          |
| `KLAVIYO_PUBLIC_KEY`       | Client-side event POSTs          |
| `GEMINI_API_KEY`           | `/api/desk` AI calls             |
| `UPSTASH_REDIS_REST_URL`   | Rate limit + response cache      |
| `UPSTASH_REDIS_REST_TOKEN` | Rate limit + response cache      |
| `TURNSTILE_SECRET_KEY`     | `/api/desk` bot challenge        |
| `NEXT_PUBLIC_GTM_ID`       | GTM container (inlined at build) |
| `NEXT_PUBLIC_CLARITY_ID`   | Optional, Microsoft Clarity      |

Never `echo "X" | vercel env add` — see
[`docs/SECURITY.md#secrets`](./docs/SECURITY.md#secrets) for why (the
trailing newline breaks the inline GTM bootstrap).

## License

[MIT](./LICENSE). The fictional "Manifest Office" brand, copy, and mood-board
imagery are illustrative — feel free to use the engineering patterns, please
don't pass the brand off as your own.

---

Built by [Maelify.com](https://maelify.com) — Shopify Plus architecture and
headless commerce engineering, Valencia · London · remote.
