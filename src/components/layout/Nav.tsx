/**
 * Top navigation — sticky header rendered on every route.
 *
 * Two visual states:
 *  - `transparent`  (default on dark heroes) — paper-on-ink, no background.
 *  - `solid`        — paper background with rule divider once the page has
 *                     scrolled past the hero (legacy threshold: 600px).
 *
 * Pages that don't have a dark hero render the nav with `forceSolid` so the
 * header reads instantly. The scroll listener (`use-nav-scroll-state`) only
 * mounts in transparent mode.
 *
 * Layer separation:
 *  - This component takes no data props beyond presentation; cart state is
 *    read by the child `<CartBadge>` via the global store.
 */

import Link from 'next/link';

import { CartBadge } from '@/components/layout/CartBadge';
import { NavScrollState } from '@/components/layout/NavScrollState';

import type { ReactElement } from 'react';

type NavLink = {
  readonly href: string;
  readonly label: string;
};

const NAV_LINKS: readonly NavLink[] = [
  { href: '/pages/editions', label: 'Editions' },
  { href: '/collections/edition-01', label: 'Dossiers' },
  { href: '/pages/system', label: 'System' },
  { href: '/pages/provenance', label: 'Provenance' },
];

const SCROLL_THRESHOLD_PX = 600;

export type NavProps = {
  /** When true, render the solid (paper) state from the first paint. */
  readonly forceSolid?: boolean;
};

export function Nav({ forceSolid = false }: NavProps): ReactElement {
  return (
    <>
      {forceSolid ? null : <NavScrollState thresholdPx={SCROLL_THRESHOLD_PX} />}
      <nav
        id="top-nav"
        data-force-solid={forceSolid ? 'true' : 'false'}
        className={[
          'fixed inset-x-0 top-0 z-50 grid grid-cols-[1fr_auto_1fr] items-center',
          'px-10 py-[22px] transition-[background-color,color,border-color] duration-[400ms] ease-out',
          'border-b border-transparent',
          forceSolid
            ? 'bg-[var(--color-paper)] text-[var(--color-ink)] border-b-[var(--color-rule)]'
            : 'bg-transparent text-[var(--color-paper)] data-[scrolled=true]:bg-[var(--color-paper)] data-[scrolled=true]:text-[var(--color-ink)] data-[scrolled=true]:border-b-[var(--color-rule)]',
        ].join(' ')}
      >
        <Link
          href="/"
          className="font-display text-[14px] font-bold tracking-[0.06em] uppercase hover:text-[var(--color-signal)] transition-colors"
        >
          Manifest Office
        </Link>

        <ul className="flex justify-center gap-8">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                data-cursor
                className="text-[13px] tracking-[0.02em] hover:text-[var(--color-signal)] transition-colors"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-end gap-[18px]">
          <span className="font-mono text-[11px] tracking-[0.04em] uppercase">EN · EUR</span>
          <CartBadge />
        </div>
      </nav>
    </>
  );
}
