# `src/hooks/` — Client-side state

**Rule:** manage state. Never call APIs directly.

Hooks that need data call into `lib/services/` via Server Actions or
client-side fetches to `app/api/*` routes.
