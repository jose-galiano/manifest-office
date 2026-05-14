# `src/lib/security/` — Abuse prevention

**Rule:** rate limiting (Upstash Redis), origin check (CORS allowlist),
Cloudflare Turnstile verification, input validation, honeypot, prompt-injection
patterns. Used by `app/api/desk/route.ts` and any future user-input route.

Fails open if env vars are missing — logs a warning, lets requests through —
so missing infra doesn't block development.
