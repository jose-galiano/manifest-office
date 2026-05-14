# `src/lib/klaviyo/` — Klaviyo events + profiles

**Rule:** wraps the Klaviyo Client + Server APIs.

Uses Client API for browser events (bypasses missing scopes on the private
key — see `docs/architecture.md`). Server-side enrichment via the private
API key when available.
