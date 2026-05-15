---
platform: 'LinkedIn (Article + Feed post)'
date: '2026-05-16'
author: 'Jose Galiano · Maelify'
asset: 'Screenshot of The Desk on demo.maelify.com (1996×1340)'
canonical: 'https://maelify.com/journal/brief-the-desk'
---

# LinkedIn — primary deliverable (long-form Article)

> Suggested title: **I shipped a theme that tells the customer what to buy. Powered by Gemini.**
> Suggested cover image: the screenshot of The Desk (memo output for "Valencia July 20 days outdoors beach paellas").
> Estimated read time on LinkedIn: 4 minutes.

---

**I shipped a theme that tells the customer what to buy. Powered by Gemini.**

The customer types one sentence. The storefront replies with a kit manifest — the exact pieces to pack, sizes, total price, ready to reserve.

No chatbot. No "How can I help?" widget. No personality. Just a memo, in the brand's typography, on the brand's grid, ending with a price total and a Reserve button.

I built it for **Manifest Office** — a Shopify Plus demo storefront I run as my portfolio piece — and it's live at **demo.maelify.com**.

This is the post about why most "AI on storefront" features convert at zero, and what we did differently.

---

**The default move is wrong.**

When a Shopify Plus brand says "we want AI on the storefront", what they get in 2026 is almost always a third-party chatbot.

A floating bubble in the bottom-right. A pop-up that says "Hi! I'm Sienna, your style assistant 👋". A free-text input that returns a paragraph of suggestions, with product links injected by regex.

It's the wrong shape for three reasons:

▸ **It breaks the brand register.** Every other surface on the storefront is on-brand. The bot speaks like a SaaS demo.

▸ **It pulls the customer out of the funnel.** They were on a PDP. Now they're in a conversation. The conversion path got longer, not shorter.

▸ **The output is shaped like a chat, not like a buying decision.** "Here are some products you might like, scroll to see more" is not how an operator decides what to take on a trip.

The "AI-on-storefront" pattern that converts isn't a chatbot. It's a **tool inside the brand's narrative** that produces an output already shaped like the next purchase.

---

**What I built.**

Manifest Office sells modular travel kits in finite editions. The brand persona is a quartermaster's office: every component has an issue number, every kit is a "system", every purchase is an "allocation". The customer is the "operator".

In that universe, the obvious first action for an operator is not a chat. It's a **brief**.

So I shipped a single input on the homepage labelled **Brief the desk**, with one placeholder example. The operator types something like:

▸ "Valencia, July, 20 days, outdoors, beach paellas"
▸ "Lisbon weekend with three site visits"
▸ "Tokyo long-haul, fourteen days, business hotel"

The desk replies with a memo. Same brand typography, same monospace register as the PDP. Structured fields: TO, FROM, RE, ALLOCATION (the kit list with prices), FORECAST (weather note), NOTE (brand tone). Ends with the total price and a Reserve button that drops the entire kit into the cart in one click.

It runs on **Google Gemini 2.5 Flash**, returns in roughly 800ms, and feels like the brand thought of it — because every output element is a brand-bible token, not a model's free-form opinion.

---

**The hard part was making it safe to ship publicly.**

A free, no-auth, AI-backed endpoint exposed on the internet is a bill waiting to happen.

Scrapers. Botnets. Prompt injectors. Lazy QA contractors who paste lorem ipsum to see if it crashes. The default implementation — "validate the input, call Gemini, return the text" — bankrupts the brand on its first viral moment.

I designed **seven security layers** that run before any paid call hits Gemini. Each layer is cheaper than the next, ordered intentionally:

▸ **Origin allowlist** — reject anything not coming from the storefront's own domain. Filters >95% of casual abuse for the cost of a string compare.

▸ **Honeypot** — a hidden form field bots fill in by reflex. If it's populated, we return a decoy 200 response and never call Gemini.

▸ **Input validation** — length bounds, word count, an injection-pattern blocklist, and a "must contain travel-shaped content" sniff. Pure function, microseconds.

▸ **Cloudflare Turnstile** — server-side challenge verification. Headless browsers get filtered here.

▸ **Per-IP rate limit** — 5 calls per hour, 20 per day on Upstash Redis. Two windows catch both bursty bots and slow-drip abuse. 429 with `Retry-After` so well-behaved clients back off.

▸ **Response cache** — SHA-256 the brief, cache the answer for 24h. If a viral share sends 10,000 visitors who all type "Lisbon weekend", we pay for one Gemini call.

▸ **The Gemini call itself**, finally — with a three-model fallback chain (Flash → Flash-Lite → 2.0 Flash) and exponential-backoff retries.

**Back-of-envelope cost math**: 10,000 visitors who all attempt to brief the desk costs roughly **$0.0015 in Gemini API spend**. Fractional cents. The whole feature runs effectively free until the storefront is generating real revenue, at which point the per-call cost is rounding noise against any sale it influences.

---

**Why this matters for a Shopify Plus brand.**

This isn't an AI experiment. It's a **conversion tool with brand discipline**:

▸ The output is already structured as a buying decision (the kit list, the total, the Reserve action).

▸ The customer doesn't pivot to a chat surface and re-enter the funnel afterwards. They stay in the funnel, with a draft allocation already prepared.

▸ The cost ceiling is set by the architecture, not by the model. We can't accidentally spend $500 in a day; the rate limit makes it impossible.

▸ The brand voice holds. Every word the desk emits sits inside the brand's typography, grammar, and price grid.

▸ It demonstrates capability — "this brand uses AI" — without the awkward marketing-of-the-feature that most AI integrations need.

In a 2026 DTC landscape where every brand is wondering where AI fits on their storefront, **the answer isn't a bot. It's a tool**. The Desk is one shape of that. There are others.

---

**Who I do this for.**

I'm a Shopify Plus architect trading as **Maelify**. I take embedded engagements with brands and agencies where the in-house team has hit the ceiling of what the existing stack can answer — three to five days a week, three to nine month arcs, working as an extension of your engineering team.

I'm in Valencia. I work fluently in English, Spanish, and Portuguese.

If you're a Shopify Plus brand wondering where AI fits on your storefront — or a CTO wondering if a feature like this can actually ship safely in production — I'd like to hear about it.

▸ The demo: **demo.maelify.com** (brief the desk yourself)
▸ The repo: github.com/jose-galiano/manifest-office (public, with the seven layers labelled in code)
▸ Email: **hello@maelify.com**

—

_If you found this useful, a like or a repost is the kindest thank-you._

#ShopifyPlus #AIengineering #HeadlessCommerce #DTC #Gemini #NextJS

---

---

# LinkedIn — companion feed post (short)

> Use this as the "feed announcement" pointing at the Article above. The first three lines must hook before the "...see more" cut at ~210 characters.

---

I shipped a Shopify storefront feature that asks the customer one question — "what's the trip?" — and replies with the exact kit to pack, the total price, and a Reserve button.

No chatbot. No widget. No personality.

Just a memo, in the brand's typography, ending with a buy action.

The customer types:

▸ "Valencia, July, 20 days, outdoors, beach paellas"

The desk replies with the right kit, sizes, weather note, total €398, ready to reserve. Powered by Gemini 2.5 Flash, returns in ~800ms.

The hard part wasn't the AI. It was making a free public AI endpoint safe to ship on a brand storefront.

I designed seven security layers that run before any paid Gemini call:

▸ origin allowlist
▸ honeypot
▸ input validation (with prompt-injection blocklist)
▸ Cloudflare Turnstile
▸ per-IP rate limit (5/hour, 20/day)
▸ 24h response cache by content hash
▸ then the Gemini call, with a three-model fallback chain

Result: 10,000 visitors who all use the feature costs about $0.0015 in API spend. Fractional cents. The architecture sets the cost ceiling, not the model.

The full breakdown — including why the cheapest layers go first, and what each rejection looks like — is in the Article linked below.

Demo (live, brief the desk yourself): demo.maelify.com
Repo (public, all seven layers labelled in code): github.com/jose-galiano/manifest-office

If you're a Shopify Plus brand wondering where AI fits on your storefront, or a CTO wondering if it can actually ship safely — let's talk.

hello@maelify.com

#ShopifyPlus #AIengineering #HeadlessCommerce #DTC #Gemini

---

# Posting notes

- **Order matters**: publish the Article first, then the Feed post within the same day. The Feed post should link to the Article and tag it natively (LinkedIn detects the link and inlines the cover).
- **Image to attach to the Feed post**: the same screenshot of The Desk (Valencia memo). LinkedIn's image-based posts outperform text-only by ~30% on engagement; the Article uses the same image as the cover.
- **Comment seeding** (post 2–3 of your own short follow-ups in the first hour to keep the post active):
  1. "If you want to see the seven layers in code, the full route file is here: github.com/jose-galiano/manifest-office/blob/main/src/app/api/desk/route.ts — each layer carries its letter as a comment."
  2. "The 'cheapest layer first' ordering is what makes the cost math work. A naive implementation that puts Turnstile or rate limit first pays the latency on every free-traffic request. Free traffic shouldn't pay for the expensive guard."
  3. "Happy to walk through this on a call if you're shipping a similar surface — embedded engagements only."
- **DM-trigger phrase**: end the Article and the Feed post with "let's talk" / "hello@maelify.com" — both are explicit CTAs that perform better than "DM me".
