// Locale-aware navigation surface. Every internal `<Link>`, `useRouter()`,
// `usePathname()`, and `redirect()` in the app imports from here instead of
// `next/link` / `next/navigation` so the current locale prefix is preserved
// across every navigation — the root cause of "price flips, then reverts on
// next click" we hit on the first deploy. External anchor tags (https://, …)
// stay on the raw HTML `<a>`.

import { createNavigation } from 'next-intl/navigation';

import { routing } from './routing';

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
