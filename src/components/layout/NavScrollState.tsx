/**
 * Scroll-position observer for the top nav.
 *
 * Toggles `data-scrolled="true"` on `#top-nav` once the window scroll passes
 * the threshold. Kept as a tiny client island so the rest of the nav stays
 * server-rendered.
 *
 * The listener is `passive` and reads `window.scrollY` directly — cheap on
 * every page. We do not use `IntersectionObserver` because the threshold is
 * tied to scroll position, not an element's viewport state.
 */

'use client';

import { useEffect } from 'react';

import type { ReactElement } from 'react';

export type NavScrollStateProps = {
  readonly thresholdPx: number;
};

export function NavScrollState({ thresholdPx }: NavScrollStateProps): ReactElement | null {
  useEffect(() => {
    const navElement = document.getElementById('top-nav');
    if (!navElement) return;

    let lastApplied: boolean | null = null;

    function applyScrollState(): void {
      if (!navElement) return;
      const scrolled = window.scrollY > thresholdPx;
      if (scrolled === lastApplied) return;
      lastApplied = scrolled;
      navElement.dataset.scrolled = scrolled ? 'true' : 'false';
    }

    applyScrollState();
    window.addEventListener('scroll', applyScrollState, { passive: true });
    return () => window.removeEventListener('scroll', applyScrollState);
  }, [thresholdPx]);

  return null;
}
