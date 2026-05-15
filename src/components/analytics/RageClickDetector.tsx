/**
 * Frustration signals: rage clicks and dead clicks.
 *
 *  - Rage click: 3+ clicks within 800 ms on the same element. Surfaces UI
 *    that looks clickable but isn't, or buttons that feel unresponsive.
 *  - Dead click: a click that hits an element with no interactive ancestor
 *    (no <a>, <button>, no onClick, no role=button, no [data-track]).
 *    Surfaces designs where users expect interaction and find none.
 *
 * Both feed `rage_click` / `dead_click` events with element selector + xy
 * so a GTM trigger can forward them to GA4 as "frustration" custom metrics
 * and Clarity will independently flag the same moments in its recording UI.
 */

'use client';

import { useEffect } from 'react';

import { CUSTOM_EVENTS, track } from '@/lib/analytics';

const RAGE_WINDOW_MS = 800;
const RAGE_THRESHOLD = 3;
const INTERACTIVE_SELECTOR =
  'a, button, input, select, textarea, [role="button"], [role="link"], [data-track], [onclick]';

function describeElement(element: Element): string {
  const tag = element.tagName.toLowerCase();
  const id = element.id ? `#${element.id}` : '';
  const cls = element.classList[0] ? `.${element.classList[0]}` : '';
  return `${tag}${id}${cls}`;
}

export function RageClickDetector(): null {
  useEffect(() => {
    let recentTarget: Element | null = null;
    let recentTimes: number[] = [];

    function onClick(event: MouseEvent): void {
      if (!(event.target instanceof Element)) return;
      const target = event.target;
      const now = performance.now();

      // --- Rage click window ---
      if (recentTarget && recentTarget === target) {
        recentTimes = recentTimes.filter((t) => now - t < RAGE_WINDOW_MS);
      } else {
        recentTimes = [];
        recentTarget = target;
      }
      recentTimes.push(now);
      if (recentTimes.length >= RAGE_THRESHOLD) {
        track(CUSTOM_EVENTS.rageClick, {
          params: {
            selector: describeElement(target),
            clicks_in_window: recentTimes.length,
            x: event.clientX,
            y: event.clientY,
          },
        });
        // Reset so we don't spam the same burst.
        recentTimes = [];
      }

      // --- Dead click ---
      const interactive = target.closest(INTERACTIVE_SELECTOR);
      if (!interactive) {
        track(CUSTOM_EVENTS.deadClick, {
          params: {
            selector: describeElement(target),
            x: event.clientX,
            y: event.clientY,
          },
        });
      }
    }

    document.addEventListener('click', onClick, { capture: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, []);

  return null;
}
