/**
 * Auto-bind click tracking to any element marked `data-track="<label>"`.
 *
 * Single delegated listener on `document` (not per-component) so adding a
 * new tracked element is a one-attribute change in the JSX, no wiring.
 * Optional metadata: `data-track-group`, `data-track-value`, `data-track-*`
 * (anything matching the pattern is forwarded as a param).
 *
 * Also detects outbound link clicks (`<a href>` to a different host) and
 * fires `outbound_click` so we can see referral flow without GA4 enhanced
 * measurement leaking PII (we strip query strings).
 */

'use client';

import { useEffect } from 'react';

import { CUSTOM_EVENTS, track } from '@/lib/analytics';

import type { EventParams } from '@/lib/analytics';

const TRACK_ATTR = 'data-track';
const TRACK_PREFIX = 'data-track-';

function collectDataTrackAttrs(element: HTMLElement): EventParams {
  const params: EventParams = {};
  for (const attr of Array.from(element.attributes)) {
    if (!attr.name.startsWith(TRACK_PREFIX)) continue;
    const key = attr.name.slice(TRACK_PREFIX.length).replaceAll('-', '_');
    if (key === '') continue;
    params[key] = attr.value;
  }
  return params;
}

function findTrackedAncestor(start: EventTarget | null): HTMLElement | null {
  if (!(start instanceof Element)) return null;
  const closest = start.closest(`[${TRACK_ATTR}]`);
  return closest instanceof HTMLElement ? closest : null;
}

function getHrefHost(element: HTMLElement): string | null {
  const link = element.closest('a');
  if (!(link instanceof HTMLAnchorElement) || !link.href) return null;
  try {
    return new URL(link.href).host;
  } catch {
    return null;
  }
}

export function AutoClickTracker(): null {
  useEffect(() => {
    function onClick(event: MouseEvent): void {
      const tracked = findTrackedAncestor(event.target);
      if (tracked) {
        const label = tracked.getAttribute(TRACK_ATTR) ?? 'unknown';
        track(CUSTOM_EVENTS.elementClick, {
          params: {
            label,
            tag: tracked.tagName.toLowerCase(),
            ...collectDataTrackAttrs(tracked),
          },
        });
      }

      // Outbound link detection runs regardless of data-track, so off-site
      // referrals from the demo are visible even on unannotated anchors.
      if (event.target instanceof Element) {
        const host = getHrefHost(event.target as HTMLElement);
        if (host && host !== window.location.host) {
          track(CUSTOM_EVENTS.outboundClick, {
            params: { destination_host: host },
          });
        }
      }
    }

    document.addEventListener('click', onClick, { capture: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, []);

  return null;
}
