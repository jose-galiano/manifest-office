# `src/lib/utils/` — Pure helpers

**Rule:** pure functions only. No side effects, no IO.

If a helper makes a network call, it belongs in a vendor adapter
(`lib/shopify/`, `lib/klaviyo/`, etc.). If it touches state, it's a hook.
