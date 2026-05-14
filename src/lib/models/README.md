# `src/lib/models/` — Data access

**Rule:** DB queries. Currently empty (no DB in scope).

If a DB is added (Postgres + Prisma, KV, etc.):

- Each function has an explicit `Promise<ReturnType>`.
- No business logic — compose in `services/`.
- If multi-tenant, all queries go through a `withTenant()` wrapper (Maelify §4).
