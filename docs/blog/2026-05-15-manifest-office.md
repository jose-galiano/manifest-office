---
title: "Manifest Office: a Shopify storefront I built for a brand that doesn't exist"
subtitle: 'The brand is fictional. The architecture is not.'
author: 'Jose Galiano · Maelify'
date: '2026-05-15'
canonical: 'https://maelify.com/journal/manifest-office'
demo: 'https://manifest-office-next.vercel.app'
repo: 'https://github.com/jose-galiano/manifest-office'
tags: ['shopify-plus', 'headless-commerce', 'next.js', 'agentic-commerce', 'rsc', 'case-study']
read_time: '8 min'
---

# Manifest Office: a Shopify storefront I built for a brand that doesn't exist

The fastest way to write good code for a Shopify Plus brand is to not have a client.

You make up a brand. You give it a brief, a colour, an anchor city, a finite allocation. You give it ten SKUs in a real Shopify dev store, with real metafields, real variants, real images. Then you build the storefront in public, the way the brand would want it built if the brand existed.

I built one. It's called **Manifest Office**, and it lives at [`manifest-office-next.vercel.app`](https://manifest-office-next.vercel.app).

The brand is fictional. The architecture is not.

## What you're looking at

Manifest Office is a quartermaster's office that issues modular travel kits in finite editions. Edition 01 anchors to the Strait of Gibraltar. 1,200 systems. Ten SKUs: a field tote, three packing cubes (S/M/L), three tech pouches (S/M/L), a toiletry kit, a luggage tag, and the Anchor Latch (the closure shared across every component).

Everything you click hits real systems:

- The products are real Shopify products, in a real Shopify Admin store, with real GraphQL queries running against the live `2025-10` API
- The allocation counter on the banner ticks up when you click "reserve" because we increment a real `manifest.allocation_issued` metafield server-side, then decrement variant inventory at the primary location
- The cart persists in `sessionStorage` with a Zustand store
- The "Brief the desk" form (AI trip-packer) runs through Google Gemini 2.5 Flash with seven layers of abuse protection (Cloudflare Turnstile, Upstash rate limit, prompt-injection regex, honeypot, origin allowlist, response cache, model fallback chain)
- Klaviyo events fire on every meaningful interaction (`Viewed Product`, `Reserved Item`, `Engraving Text Entered`, `Desk Briefed`, `Manifest Email Saved`)
- The 3D exploded latch viewer is real Three.js, hand-rolled, no orbit-controls library
- The atelier audio bed in the top banner is a six-minute ambient track generated via Suno, loaded only on user gesture, with a CSS waveform and a hover-reveal volume slider

The whole thing is fake the way a portfolio piece is fake. Every line of code is the way I would ship it for a paying brand.

## The stack, with the reasoning

A stack list without reasoning is just résumé padding. Here's what's there, and why.

**Next.js 15 App Router with Server Components and streaming.** Because in 2026, every page that doesn't need JS shouldn't ship it, and every page that does ship JS should ship the minimum slice it needs. RSC streams the cart drawer's static chrome ahead of its interactive bits. The PDP's specs grid, dossier metadata, and JSON-LD render on the server; only the buybox, gallery swap, 3D viewer, and the Desk form are client islands.

**TypeScript strict, with `noUncheckedIndexedAccess`.** Because the wrong way to find that `product.variants[0]` is undefined is at 3am from a Sentry alert. The right way is at PR time.

**Tailwind 4 with `@theme` design tokens.** Brand colours and fonts live in one CSS block. Every component reads from them. Changing the Edition 02 accent from signal-orange to lichen-green is one token edit.

**Zustand for cart state.** Because Redux is the wrong size, and Context is the wrong shape. The cart has eleven actions and a persisted slice. Zustand is six lines.

**Three.js, no controls library.** The hero is a 100×100 vertex topographic plane with elastic cursor displacement (Gaussian falloff, per-vertex spring lerp, ~1.2ms CPU per frame). Colour comes from a custom shader: three-stop gradient on vertex height with exponential ink fog. The exploded latch viewer is thirteen primitives with a hand-rolled drag-orbit, HTML label overlays positioned via `Vector3.project()` every frame, and an IntersectionObserver that pauses rendering when offscreen. Both honor `prefers-reduced-motion`.

**Shopify Admin GraphQL `2025-10` directly.** Not the Storefront API. Because we're a portfolio piece running on a Pause-and-Build plan, the boundary is server-only. Admin GraphQL queries live inside the function that executes them (Maelify framework §3) so renaming a query never leaves a dangling top-level constant.

**Klaviyo Client API for events.** Public-key, server-proxied through `/api/track`. The private key has a missing scope I can't grant on this plan, so the Client API endpoint is the workable path. The pattern is identical to what I'd ship for a real merchant once their API keys are clean.

**Google Gemini 2.5 Flash with a three-model fallback chain.** Flash first, then Flash-Lite, then 2.0 Flash. Three attempts each with exponential backoff. The Desk responds in 800ms on the warm path.

**Cloudflare Turnstile + Upstash Redis for abuse.** Both fail open if their env vars are missing, so local dev never blocks on infra that doesn't exist yet. In production they activate by env presence.

## The conversion-aware homepage

Most DTC homepages are an art-directed lifestyle banner followed by a story about a founder. Then, ten scrolls down, a product.

This one isn't.

Five-second clarity rule, single CTA above the fold. Then a four-up product grid with live allocation counters. Then a trust strip (origin, allocation, shipping, returns). Then the brand narrative (manifesto, editorial gallery, edition feature, process, named operators). Then a closing dark-bleed CTA with the live "still to issue" counter. Then the Desk. Then email capture.

This is the canonical 2026 high-converting DTC homepage stack, mapped onto a brand that earned every section.

The decisions that matter:

- **No countdown timer.** The brand bible's anti-brief lists it explicitly. Scarcity is real (the allocation metafield ticks honestly) or it doesn't get expressed.
- **No fake "5 people viewing now" badge.** Same reason.
- **No `aggregateRating` in the JSON-LD.** The brand has no real reviews. Faking them is a hire-killer in 2026.
- **Operator quotes, not press logos.** The brand isn't in _Esquire_. It has three named practitioners (Cristina at the sample room, Marc on trims, Joana the field tester). Their portraits run as editorial photography, not stock smiles.

## The part nobody is building yet

If a recruiter opens the rendered HTML source on a Manifest Office product page, they see:

- A `Product` JSON-LD graph with `hasMerchantReturnPolicy` (30-day, Porto-based), `shippingDetails` (free EU above €150, €8 flat below, 1–2 day transit), `category` mapped to Google's product taxonomy, `availability` derived from the live metafield (`<80% issued = InStock`, `80–99% = LimitedAvailability`, `100% = SoldOut`), `priceValidUntil` tied to Edition close, and `isAccessoryOrSparePartFor` linking the Anchor Latch to every bag SKU in the system
- An `Organization` and `WebSite` graph injected site-wide, cross-referenced by stable `@id`
- An `OfferCatalog` on every collection page
- A `BreadcrumbList` on every nested route

If a Claude or ChatGPT shopping agent crawls the same page, it also sees:

- `/robots.txt` with explicit allow for `GPTBot`, `ClaudeBot`, `anthropic-ai`, `Google-Extended`, `PerplexityBot`, `Applebot-Extended`, `Amazonbot`, `ChatGPT-User`, and `OAI-SearchBot`, paired with explicit disallow on the abuse-protected command surface (`/api/reserve`, `/api/desk`, `/api/track`, `/api/config`) while leaving `/api/products` open as the structured ingest endpoint
- `/llms.txt` and `/llms-full.txt` per [llmstxt.org](https://llmstxt.org), text/plain, cached one hour browser / twenty-four hours shared / seven days stale-while-revalidate
- `/sitemap.xml` with 21 canonical URLs
- A per-product OpenGraph image generated on demand via Next 15's `ImageResponse`, so a Slack or iMessage link preview lands with the right title, price, and dossier ordinal even when an agent shares a Manifest Office URL

Most DTC brands in May 2026 still haven't named the problem this layer solves. Apple Intelligence and Operator are in their second year. Shopify Magic is two product cycles old. Agentic commerce ingest, real categorical metadata, structured returns, and `llms.txt` are about to be table stakes. They're not yet.

A senior engineer ships them now.

## Brand discipline is engineering discipline

Manifest Office has a brand bible. Sixteen sections. Photography rules. A forbidden-typeface list. A motion language with cubic-bezier curves named. An anti-brief that says, verbatim, "no autoplay audio, no cursor lag, no countdown timer, no 'issued, not sold' tagline because it's posturing without backing."

This isn't decorative. It's load-bearing.

The "no autoplay audio" rule pushed me to build an opt-in ambient toggle in the top banner with explicit play, hover-reveal volume, session-scoped position resume, and a CSS-only waveform that costs zero CPU while paused. That's a different audio control than the autoplay-with-mute pattern most brands ship. Better.

The "one signal-orange accent per scroll-frame" rule pushed me to a deliberate hover register: when a colorway swatch is active, the colorway caption inherits its name in uppercase mono. When the engraving fee is added, the price line gets a small `+€22 ENGRAVING` Signal Orange caption. Nowhere else. The accent earns its appearance.

The "no faces on PDP" photography rule (with one exception: workshop and sample-room context on the Provenance page) drove a 28-image generation pass with explicit `negativePrompt` clauses banning text, logos, and faces from every Imagen call. The whole brand-photo set reads as one register because the prompt discipline was one register.

Design discipline drives engineering discipline. They show up in the same file at the same level of resolution. When a brand bible says "every component decelerates," you write a `cubic-bezier(0.23, 1, 0.32, 1)` and stop reaching for `ease-out`. When it says "metadata renders in mono," you ship a `font-mono text-[11px] tracking-[0.04em] uppercase` utility set and stop letting display-stack creep into specs strips.

A brand is the constraint that makes the product readable. Engineering executes the constraint.

## Some senior-engineer choices that earned the build

A few decisions I'd defend in a code review:

**Variant URLs are real.** Each Tech Pouch size is a separate Shopify product with its own canonical URL (`/products/tech-pouch-s` / `tech-pouch-m` / `tech-pouch-l`). Clicking a size triggers `router.replace(url, { scroll: false })` inside a `useTransition` so the page stays mounted and the RSC payload streams in. Colorway selection updates the URL via `history.replaceState` directly (no router involvement, no force-dynamic re-fetch) because nothing the server cares about has changed. Two different URL-sync mechanisms because they're solving two different problems.

**The engraving fee is server-derived.** The client submits the engraving text. The server re-sanitises it (`/[^A-Z0-9.\-· ]/g`, max 15 chars, uppercase) and re-derives the €22 fee from a typed constant before mutating Shopify. Anti-tamper engineering, two extra lines of code.

**The Maelify framework's layer separation is enforced by ESLint.** A custom `no-restricted-syntax` rule rejects any top-level GraphQL template literal so a query string never lives outside the function that calls it. The Zero-`any` policy is an error, not a warning. `sonarjs/no-identical-functions` blocks copy-paste before it reaches a PR.

**Pre-commit gates ship every commit.** Husky + lint-staged run `tsc --noEmit`, `eslint --fix`, and `prettier --write` on every staged change. The repo has never had a red commit.

**A console signature for the curious.** Recruiters who open devtools see a styled `console.info` card: stack, surfaces worth poking, a `mailto:`, and a github slug. Stripe, Vercel, and Linear all do this in 2026. It costs 1.2KB. The conversion-into-conversation rate is real.

## What this demo deliberately doesn't ship

A senior portfolio piece names its boundaries.

- **No real checkout.** The store is on Shopify's Pause-and-Build plan, so the cart-to-payment path is blocked at the platform level. The "Reserve from Edition 01" action increments allocation and inventory; it doesn't take money.
- **No customer accounts.** `/account*` is reserved in the route map. Not built.
- **No `/search`.** Reserved, not built.
- **No i18n.** Single language. When a brand has bilingual reach (Maelify itself does), the framework enforces both `en.json` and `es.json`. This demo doesn't, deliberately, to keep the example tight.
- **No real press, no real reviews.** Substituted with named operators. When a brand actually has press and verified reviews, both go in their proper schema.org graphs.

The boundaries are visible because the work is honest.

## How to hire

I take embedded engagements with Shopify Plus brands and headless-commerce builds where the in-house team has hit the ceiling of what the existing stack can answer. Three to five days a week, three to nine month arcs, working as an extension of the engineering team. Architecture review, build, handoff.

I'm in Valencia. I work fluently in English, Spanish, and Portuguese. I'm fluent enough in Mandarin to take a brief.

If you're building something that needs Shopify Plus architecture, headless commerce on Next.js or Hydrogen, AI ingest and agentic-commerce readiness, or just a senior engineer who reads brand bibles before pull requests, I'd like to hear about it.

[**hello@maelify.com**](mailto:hello@maelify.com) · [linkedin.com/in/jose-galiano](https://www.linkedin.com/in/jose-galiano/)

The demo, again: [**manifest-office-next.vercel.app**](https://manifest-office-next.vercel.app).

Open the browser console while you're there.

---

_Powered by Maelify.com_

<!--
NOTES FOR REPUBLISHING

Maelify.com (Shopify blog):
  - Drop the front-matter block (Shopify reads it from the article record).
  - Title + subtitle → article title field, with the subtitle as the article excerpt.
  - Keep canonical = maelify.com/journal/manifest-office. Set rel-canonical
    on every other republished destination back to this URL.

LinkedIn article:
  - Strip front-matter.
  - Drop the per-stack-item code-block aesthetic; LinkedIn renders blocks
    awkwardly. Inline `code` is fine.
  - Compress the "stack with reasoning" section to roughly half its length.
    LinkedIn's audience skims more than maelify.com's does.
  - Add the demo URL and Maelify CTA twice: once in the third paragraph,
    once at the end. LinkedIn cuts the preview at ~150 words.

dev.to / Hashnode:
  - Front-matter compatible with both platforms; tag set already in the
    frontmatter is dev.to-ready (max 4 tags accepted).
  - Add `cover_image` URL pointing at an exported version of the WebGL hero
    (a still frame from `manifest-office-next.vercel.app/`).
  - Consider expanding the "senior-engineer choices" section with one or two
    short code snippets. That audience reads code, not prose.
-->
