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

- **A guided tour built for the 30-second recruiter pass.** Press `D`
  anywhere (or click the floating chip bottom-left) to open Build Notes —
  five panels surfacing the stack, every shipped feature with a deep-link
  to its DOM anchor, performance numbers, commerce mechanics, and the
  source. No hunting required.
- **Real Shopify integration** — 10 active products on a live store, the
  PLP and PDP both hit Shopify Admin GraphQL, the Reserve button writes an
  `allocation_issued` metafield through a server action, and the count on
  the page is the live count.
- **Wishlist with shareable links.** LocalStorage-backed Zustand store,
  cross-tab sync via the `storage` event, drawer with live allocation
  re-fetch, `Share my wishlist` copies a `?w=handle,handle` URL that
  hydrates into a read-only "Shared with you" preview when opened.
- **Quick-Add bottom sheet.** Single-colorway SKUs reserve directly with a
  haptic tap; multi-colorway opens a sheet — card-anchored popover on
  desktop, slide-up from the bottom on mobile with drag-to-dismiss.
- **PDP thumbnail carousel** with hero + two alt-angle shots per SKU, all
  generated img-to-img off the same Charcoal hero so the silhouette stays
  identical across the three frames. The grid reads as a typology, not a
  shoot.
- **A 7-layer-defended Gemini endpoint** (`/api/desk`) — origin allowlist,
  honeypot, Turnstile, input validation, rate limiting, response cache,
  then the AI call. Every layer is labelled in code (`SECURITY.md` has the
  full breakdown).
- **Agentic commerce surface** — `/llms.txt` and `/llms-full.txt` route
  handlers expose a structured catalogue specifically for LLMs. robots.txt
  explicitly allows AI bots. Same content is the source of truth for the
  human storefront and the machine one.
- **WebGL + 3D + scrollytelling** — homepage hero is a custom shader-driven
  topographic wireframe of the Strait of Gibraltar with cursor-elastic
  deformation. The Anchor Latch PDP runs a 193-frame AVIF scroll-scrubbed
  reveal sequence (1.7 MB total). Every PDP has a drag-rotatable,
  exploded-view 3D viewer for a 7-piece kit.
- **In-house product photography pipeline.** Every PLP card is regenerated
  through Gemini 3 Pro Image (Nano Banana) with a locked Mismo-discipline
  prompt template — straight-on profile, paper-cream backdrop `#F2EFE8`,
  soft north-light, faint contact shadow. Hardware finishes (Bronze
  Anchor Latch, Tobacco Luggage Tag) generated img-to-img off the
  Charcoal hero so the form factor is identical across colorways.
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

| Layer        | Choice                                              |
| ------------ | --------------------------------------------------- |
| Framework    | Next.js 15.5 (App Router, Turbopack)                |
| UI           | React 19, Tailwind CSS 4 (`@theme`)                 |
| Language     | TypeScript 5 (strict + uncheckedIndex…)             |
| 3D / shaders | Three.js r184                                       |
| State        | Zustand · cart (sessionStorage) + wishlist (local)  |
| Runtime      | Node 22 LTS, pnpm 11                                |
| Commerce     | Shopify Admin GraphQL (`2025-10`)                   |
| AI · runtime | Google Gemini 2.5 Flash for `/api/desk`             |
| AI · assets  | Gemini 3 Pro Image (Nano Banana) for product photos |
| CRM          | Klaviyo Events + Profiles API                       |
| Edge         | Vercel, Upstash Redis (rate / cache)                |
| Analytics    | GA4 + GTM + Consent Mode v2                         |
| Quality      | ESLint, Prettier, Husky, sonarjs                    |

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
│   ├── ui/                    Atomic primitives + ProductCard, WishlistHeart,
│   │                          QuickAddSheet
│   ├── layout/                Nav, Footer, CartDrawer, WishlistDrawer,
│   │                          WishlistBadge, WishlistShareHydrator,
│   │                          BuildNotes, ConsoleSignature
│   ├── sections/              Page sections (HomeHero, PdpBuybox, PdpGallery,
│   │                          ScrollLatchReveal, ExplodedLatchViewer, …)
│   └── analytics/             GTM, ConsentBanner, trackers
├── lib/
│   ├── analytics/             `track()` helper, types, identity, consent
│   ├── shopify/               Admin GraphQL client + queries
│   ├── klaviyo/               Events + Profiles API
│   ├── gemini/                Google Generative AI client
│   ├── security/              Rate limiting, Turnstile, origin allowlist
│   ├── services/              Orchestration — fetch-products, reserve-product,
│   │                          plp-image-overrides (curated photo + synthetic
│   │                          colorway injection at the data layer)
│   ├── seo/                   JSON-LD, OpenGraph, llms.txt builders
│   ├── three/                 Exploded-scene geometry + tween logic
│   ├── state/cart.ts          Zustand cart (sessionStorage persisted)
│   ├── state/wishlist.ts      Zustand wishlist (localStorage + cross-tab sync)
│   ├── types/                 Shared TS types
│   ├── constants/             Commerce + security tunables, colorway hex map
│   └── utils/                 Pure helpers
├── content/manifest-office.ts Product catalog + brand copy (SSoT)
└── hooks/
    ├── use-cart.ts            Cart surface (Maelify §1: components → hooks → state)
    ├── use-wishlist.ts        Wishlist surface
    └── use-quick-add.ts       Reserve → cart → drawer-open transition flow
```

Layer separation is enforced by ESLint (e.g. components can't import from
`lib/state/` directly — they go through `hooks/`). Full rules in
[`docs/architecture.md`](./docs/architecture.md).

## Highlights

### Build Notes — the 30-second recruiter tour

Floating chip bottom-left of every page, plus a global `D` keyboard
shortcut. Opens a right-side sheet with five panels:

- **01 Stack** — framework, language, commerce, AI, edge, first-load JS
- **02 Features** — every shipped feature with a deep-link to its DOM
  anchor (`/#hero`, `/products/anchor-latch#anchor-story`,
  `/collections/edition-01#dossiers`, `/products/cube-m#allocation`, …).
  Click closes the sheet and lands the visitor on the feature itself.
- **03 Performance** — Lighthouse mobile median, LCP, CLS, WebGL gating
  strategy, image pipeline numbers
- **04 Commerce** — edition mechanics, reserve flow, cart, wishlist,
  variants, intentional checkout omissions
- **05 Source** — public MIT repo, Maelify, contact

After 6s without interaction the chip pulses twice to draw the eye, then
quiets down. ESC / click backdrop / `D` again closes. The aside uses
`inert` (not `aria-hidden`) so it never traps focus when collapsed.

Mounted once in `app/layout.tsx`. State is local. See
`src/components/layout/BuildNotes.tsx`.

### Wishlist + shareable URL

LocalStorage-backed Zustand store with a cross-tab `storage` event
listener — add an item in one tab, the badge ticks in every other tab
within ms. Drawer fetches `/api/products` on open to refresh allocation
counts in real time (low stock renders signal-orange under 80 remaining).

Share button generates `?w=handle1,handle2,…` and uses `navigator.share`
on mobile or clipboard on desktop. The receiving URL hydrates the same
drawer in read-only "Shared with you · preview" mode with a `Save all to
my wishlist` CTA; after hydration the query param is stripped via
`history.replaceState` so a refresh doesn't re-open. Handle validation
guards against malformed input (max 24 handles, regex-checked).

Mutually exclusive with the cart drawer — opening either closes the
other. Mobile UX is intentionally less intrusive: the heart-tap on a
product card flashes the header badge instead of opening the drawer.

### Quick-Add Sheet

Floating `+ Add` pill on every product card. Single-colorway SKUs reserve
directly (haptic via `navigator.vibrate(15)`, badge pulse, `✓ Added`
inline confirmation, then cart drawer opens). Multi-colorway products
open `QuickAddSheet` — a card-anchored absolute popover on desktop, a
fixed bottom sheet with drag-to-dismiss on mobile. ESC + backdrop close.

Reserve flow flows through the same `reserveProductAction` server action
as the PDP buy box, so analytics + cart line + Klaviyo fan-out are
identical to a PDP reservation. The shared `useQuickAdd` hook owns the
transition: pending → success → drawer-open.

### PDP thumbnail carousel

Hero plus a horizontal thumb strip below. Click any thumb to swap the
hero. Active thumb is outlined ink, others hover. Same state used by the
colorway swatches, so changing the colorway swaps the hero through the
exact same code path as a thumb click.

Two alt shots per SKU live in `/public/images/products/charcoal-alt/`:

- `*-detail.webp` — macro crop of the zipper, button, or closure
- `*-angle.webp` — 3/4 perspective showing depth + side profile

All generated img-to-img off the Charcoal hero (Gemini 3 Pro Image with
the reference image inlined as `inline_data`) so the silhouette is
identical across the three frames. The grid reads as one shoot.

### In-house product photography pipeline

Every PLP card photo is regenerated, not scraped from the Shopify
seeding. The retake uses a locked prompt template (Mismo discipline —
straight-on profile, paper-cream backdrop `#F2EFE8`, soft north-light,
near-shadowless contact shadow, museum-catalogue restraint) plus a dense
negative-prompt paragraph (no text, no props, no flat-lay, no multiple
objects, no harsh shadows) baked into the user message — Gemini doesn't
take a separate `negativePrompt` field the way Imagen did.

`/tmp/gen-plp.sh` (the generator) is in the repo's task log; the locked
prompt + per-SKU subject line are in
`src/lib/services/plp-image-overrides.ts`. PNG outputs are
gitignored — only the WebP-at-q82 conversions ship (10-40 KB each at
896×1200). Hardware finishes (Tobacco luggage tag, Bronze anchor latch)
were generated img-to-img off the Charcoal hero so the form factor is
identical across colorways.

The data-layer override (`resolvePlpImage(handle)`) injects the curated
hero + alt shots into `mapNodeToProduct` so the Shopify-side `featured
image` and gallery tail are replaced cleanly — no orphan media to clean
up in the Shopify admin, no scope risk.

### Anchor Latch scrollytelling

193-frame AVIF sequence (1.7 MB total) generated from a Higgsfield
render. Sticky canvas in a 420vh container; scroll progress drives the
frame index via `requestAnimationFrame`, gated by IntersectionObserver
so the frames only load when the section enters the viewport. Five
narrative beats: closed latch → rotation → mechanism reveal → tolerance
→ exploded view. `prefers-reduced-motion` renders the exploded final
frame statically. Mounted on the homepage AND on
`/products/anchor-latch` so visitors on either path see the story.

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
