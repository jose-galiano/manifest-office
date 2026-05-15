/**
 * Fire a `page_view` on every App-Router navigation.
 *
 * The Next App Router doesn't reload the document on navigation, so GTM's
 * built-in History Change trigger fires but with stale `page_path`. We push
 * an explicit `page_view` keyed off `usePathname` + `useSearchParams` so
 * the GA4 page-tracking matches reality (and so SPA-only routes like
 * `/cart` get counted at all).
 */

'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

import { CUSTOM_EVENTS, track } from '@/lib/analytics';

export function PageViewTracker(): null {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.toString();
    const fullPath = query ? `${pathname}?${query}` : pathname;
    track(CUSTOM_EVENTS.pageView, {
      params: {
        page_path: fullPath,
        page_referrer: typeof document !== 'undefined' ? document.referrer : null,
      },
    });
  }, [pathname, searchParams]);

  return null;
}
