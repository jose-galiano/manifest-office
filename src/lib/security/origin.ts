// CORS / origin allowlist for `/api/desk`. Returns true for production
// origins, localhost, and any preview deploy under the tmsjoses-projects
// Vercel team.

import { ALLOWED_ORIGINS, VERCEL_PREVIEW_ORIGIN_REGEX } from '@/lib/constants/security';

export function isAllowedOrigin(origin: string | null | undefined): boolean {
  if (!origin) {
    return false;
  }
  if (ALLOWED_ORIGINS.has(origin)) {
    return true;
  }
  return VERCEL_PREVIEW_ORIGIN_REGEX.test(origin);
}

// Derive a usable origin from a Request. Prefers the `Origin` header; falls
// back to a sanitised `Referer` (chops the path so the allowlist match works).
export function deriveOrigin(request: Request): string {
  const origin = request.headers.get('origin');
  if (origin) {
    return origin;
  }
  const referer = request.headers.get('referer');
  if (!referer) {
    return '';
  }
  try {
    const url = new URL(referer);
    return `${url.protocol}//${url.host}`;
  } catch {
    return '';
  }
}
