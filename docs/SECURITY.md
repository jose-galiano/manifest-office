# Security policy

Public-facing storefronts live or die by their unsexy edges: input validation,
rate limits, secrets hygiene, and consent. This document is the runbook.

## Reporting a vulnerability

Mail `security@maelify.com`. Use PGP if available. We respond within 48 hours,
disclose coordinated within 90 days, and credit reporters in the changelog.

Do **not** open public GitHub issues for security findings.

## Threat model

| Threat                                         | Surface                                             | Control                                                         |
| ---------------------------------------------- | --------------------------------------------------- | --------------------------------------------------------------- |
| **Credential exfiltration**                    | `.env`, build logs, shell history, video recordings | Vercel-only env, no `echo` of values, `.env*` gitignored        |
| **Abuse of Gemini quota** via `/api/desk`      | Public API route, no auth                           | 7-layer defense (see below)                                     |
| **Shopify Admin API abuse**                    | Admin scopes via app token                          | Token has only the scopes the demo needs, rotated quarterly     |
| **PII leakage to analytics**                   | dataLayer, Klaviyo events                           | No email/phone in dataLayer; Consent Mode v2 default-denied     |
| **Prompt injection** in Gemini-rendered output | `/api/desk` user input                              | Output is rendered as text, never as HTML; system prompt sealed |
| **CSRF / cross-origin abuse** of POST routes   | `/api/reserve`, `/api/track`, `/api/desk`           | Origin allowlist, SameSite cookies (none currently set)         |
| **XSS via product / Shopify-sourced content**  | PDP description, blog content                       | All Shopify text rendered through React (auto-escaped)          |
| **Open redirect**                              | `next/link`, server `redirect()`                    | All redirect targets are static literals or validated paths     |

## `/api/desk` — 7-layer defense

The Gemini-backed trip-brief endpoint is the only public API that touches a
paid third-party (Generative AI). Each layer is labelled in
`src/app/api/desk/route.ts` so you can follow the inline comments.

| #   | Layer                    | What it does                                                                 | Failure mode                            |
| --- | ------------------------ | ---------------------------------------------------------------------------- | --------------------------------------- |
| C   | **Origin allowlist**     | Reject any POST whose `Origin` header is not `demo.maelify.com` or localhost | 403, no Gemini call                     |
| E   | **Honeypot field**       | A hidden `companyName` field; bots fill it, humans don't                     | 400 silently, no Gemini call            |
| D   | **Input validation**     | Zod schema on the brief payload — types, lengths, required fields            | 400 with the field name; no Gemini call |
| F   | **Cloudflare Turnstile** | Server-side token verification                                               | 403, no Gemini call                     |
| B   | **Rate limiting**        | 5 calls per IP per hour, 20 per day (Upstash Redis sliding window)           | 429 with `Retry-After`                  |
| G   | **Response cache**       | SHA-256 of brief → cached Gemini response for 24h (Upstash Redis)            | Cheaper repeat, identical output        |
| Z   | **Gemini call**          | The actual `generateContent`, with a sealed system prompt                    | Gemini errors map to 502 with safe text |

The layers run **in order**. C–F all reject before any spend is incurred. B
also runs before Gemini, but only after the cheaper guards have already
dropped the obvious abuse. The cache (G) sits in front of Gemini so a viral
share never multiplies cost.

## Secrets

- Live in **Vercel environment variables only**. Pull locally with
  `vercel env pull .env.local` — _do not_ commit `.env.local`.
- `.env*` is gitignored at every depth.
- `.env.example` is the only env file that gets committed. Keep keys current.
- **Never** `echo "X" | vercel env add` — the shell appends a newline, the
  newline ends up in the stored value, and inline JS bootstraps break across
  the newline. Use `printf "X" | vercel env add` or paste interactively.
- Rotation cadence: Shopify Admin token quarterly, Klaviyo keys yearly or on
  team departure, Gemini key on suspected abuse.

## Pre-push secret scan

The repo ships a `.gitleaks.toml` baseline. Run before any push to a new
remote, and CI runs it on every PR.

```bash
gitleaks detect --redact --no-banner
```

If you find a secret in history: rotate the secret first, then squash-rebase
to strip it. **The leaked value is compromised even after a force-push**,
because git mirrors and CI caches preserve history.

## Consent and privacy

- **Consent Mode v2** defaults to `denied` for analytics + ad storage. The
  user opts in via the bottom-of-page banner. See
  [`docs/analytics-setup.md`](./analytics-setup.md) for the full taxonomy.
- **No PII in the dataLayer.** Anonymous IDs are random UUIDs, scoped to
  `localStorage` (not synced to a server-side identity service).
- **Klaviyo events** include email **only** when the visitor has saved it in
  the cart drawer or footer capture — i.e. given explicit consent.
- **Microsoft Clarity** (optional) is wired but disabled until a project ID
  is provided. Clarity respects the same Consent Mode signal.

## Dependency hygiene

- `pnpm install --frozen-lockfile` in CI — no untracked upgrades.
- `pnpm audit` run quarterly. Critical CVEs (e.g., CVE-2025-66478 in Next 15)
  are patched within 24h of disclosure; see commit history for cadence.
- `pnpm.onlyBuiltDependencies` is explicit so post-install scripts can't run
  on packages we didn't intend (supply-chain mitigation).

## CSP and security headers

This is currently **deferred** for the demo:

- No CSP header is set (Three.js and inline GTM/consent scripts need
  `'unsafe-inline'`/`'unsafe-eval'` for the WebGL hero — a strict CSP
  requires a nonce-based refactor of the analytics layer).
- HSTS, X-Frame-Options, Referrer-Policy are not set in `next.config.ts`.
  Vercel applies sane defaults at the edge.

Before promoting this codebase to a production retail store, add explicit
headers in `next.config.ts.headers()` and a nonce-based CSP. Trade-off: the
WebGL hero will need to be moved to an external module or fall back to a
static image when CSP rejects the inline shader.
