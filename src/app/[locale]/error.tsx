/**
 * Route-level error boundary. Catches uncaught exceptions inside any nested
 * route segment and renders a branded recovery surface instead of the
 * generic Next.js fallback. Pairs with `not-found.tsx` for 404s.
 *
 * Notes:
 * - Must be a Client Component (Next requires `'use client'` on error.tsx).
 * - The `digest` is the server-side error fingerprint; surfacing it lets a
 *   visitor quote it to support and lets us correlate against Vercel logs
 *   without exposing the raw stack.
 * - `reset()` re-renders the failing segment. Combined with the "Return to
 *   Edition 01" link, the visitor gets both an in-place retry and a graceful
 *   escape hatch.
 */

'use client';

import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

import { Link } from '@/i18n/navigation';

import type { ReactElement } from 'react';

export type ErrorBoundaryProps = {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
};

export default function RouteError({ error, reset }: ErrorBoundaryProps): ReactElement {
  const t = useTranslations('error');
  useEffect(() => {
    // Surface to Vercel logs. Avoid PII; the digest is server-side and the
    // message is what a developer can grep for.
    console.error('[route-error]', { digest: error.digest, message: error.message });
  }, [error]);

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center bg-[#F2EFE8] px-10 py-32 text-center text-[#0B0F0E]">
      <span className="mb-4 font-mono text-[11px] uppercase tracking-[0.08em] text-signal">
        {t('eyebrow').toUpperCase()}
      </span>
      <h1 className="max-w-[20ch] font-display text-[clamp(48px,7vw,96px)] font-bold leading-[0.95] tracking-[-0.02em]">
        {t('title')}
      </h1>
      <p className="mt-6 max-w-[48ch] text-[16px] leading-[1.55] text-[#0B0F0E]/85">{t('body')}</p>
      {error.digest ? (
        <code className="mt-6 inline-block bg-[#0B0F0E]/8 px-3 py-1.5 font-mono text-[11px] tracking-[0.08em] text-[#0B0F0E]/70">
          ref · {error.digest}
        </code>
      ) : null}
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={reset}
          data-cursor
          className="inline-flex items-center justify-center gap-2 bg-[#0B0F0E] px-6 py-4 font-mono text-[12px] uppercase tracking-[0.1em] text-[#F2EFE8] transition-[letter-spacing,background] hover:bg-[#D24A1F] hover:tracking-[0.14em]"
        >
          {t('retry')} →
        </button>
        <Link
          href="/collections/edition-01"
          data-cursor
          className="inline-flex items-center justify-center gap-2 border border-[#0B0F0E]/35 px-6 py-4 font-mono text-[12px] uppercase tracking-[0.1em] text-[#0B0F0E] transition-colors hover:border-[#0B0F0E]"
        >
          {t('go_home')}
        </Link>
      </div>
    </main>
  );
}
