/**
 * Fire `scroll_depth` at granular thresholds (10/25/50/75/90/100%) per page.
 *
 * GA4 enhanced measurement only emits at 90% — useful but coarse. Knowing
 * how far visitors get before bouncing (and which fold is "the wall") is
 * one of the most actionable signals for landing-page design, so we add
 * the finer thresholds here.
 *
 * Resets on route change so each page measures independently.
 */

'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

import { CUSTOM_EVENTS, track } from '@/lib/analytics';

const THRESHOLDS = [10, 25, 50, 75, 90, 100] as const;

export function ScrollDepthTracker(): null {
  const pathname = usePathname();

  useEffect(() => {
    const reached = new Set<number>();

    function computePct(): number {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return 100;
      return Math.min(100, Math.round((window.scrollY / scrollable) * 100));
    }

    function onScroll(): void {
      const pct = computePct();
      for (const threshold of THRESHOLDS) {
        if (pct >= threshold && !reached.has(threshold)) {
          reached.add(threshold);
          track(CUSTOM_EVENTS.scrollDepth, { params: { depth_pct: threshold } });
        }
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    // Fire once on mount in case the page is short and already 100% scrolled.
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [pathname]);

  return null;
}
