# `src/lib/types/` — Shared TypeScript types

**Rule:** interfaces and type aliases used in 2+ files live here.

Single-use types stay co-located with their function. As soon as a type is
imported by a second module, it moves here.
