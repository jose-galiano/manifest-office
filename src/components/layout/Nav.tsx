/**
 * Top navigation — fixed header rendered on every route.
 *
 * Default = SOLID (paper bg, ink text). Pages with a dark full-bleed hero
 * (`/`) auto-detect via `usePathname()` and switch to transparent-over-dark
 * so the WebGL canvas renders edge-to-edge. On those routes, scrolling past
 * 600px flips the nav back to solid.
 *
 * Mobile (< md, 768px): center link list and EN·EUR label are hidden. A
 * hamburger sits on the right next to the cart badge; tapping opens a
 * full-screen overlay menu styled in the same paper-on-ink register as the
 * main nav. Body scroll is locked while the menu is open.
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { CartBadge } from '@/components/layout/CartBadge';
import { WishlistBadge } from '@/components/layout/WishlistBadge';

import type { ReactElement } from 'react';

type NavLink = {
  readonly href: string;
  readonly label: string;
  /** Plain-English subtitle for first-time visitors who don't yet read the brand voice. */
  readonly sublabel: string;
};

const NAV_LINKS: readonly NavLink[] = [
  { href: '/pages/editions', label: 'Editions', sublabel: 'Limited Releases' },
  { href: '/collections/edition-01', label: 'Dossiers', sublabel: 'All Products' },
  { href: '/pages/system', label: 'System', sublabel: 'The Complete Kit' },
  { href: '/pages/provenance', label: 'Provenance', sublabel: 'Our Story' },
];

const SCROLL_THRESHOLD_PX = 600;

function hasDarkHero(pathname: string | null): boolean {
  if (!pathname) return false;
  if (pathname === '/') return true;
  return false;
}

export type NavProps = {
  readonly forceSolid?: boolean;
};

export function Nav({ forceSolid }: NavProps = {}): ReactElement {
  const pathname = usePathname();
  const resolvedForceSolid = forceSolid ?? !hasDarkHero(pathname);
  const [scrolled, setScrolled] = useState<boolean>(false);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    if (resolvedForceSolid) {
      setScrolled(false);
      return;
    }
    const onScroll = (): void => {
      setScrolled(window.scrollY > SCROLL_THRESHOLD_PX);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [resolvedForceSolid]);

  // Close the mobile menu on every pathname change so a tap on a link
  // dismisses the overlay before the new page settles.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Lock body scroll while the menu overlay is open.
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const isSolid = resolvedForceSolid || scrolled;

  const handleMenuToggle = useCallback((): void => {
    setMenuOpen((open) => !open);
  }, []);

  return (
    <>
      <nav
        id="top-nav"
        data-solid={isSolid ? 'true' : 'false'}
        className={[
          'fixed inset-x-0 top-9 z-50 grid grid-cols-[1fr_auto_1fr] items-center',
          'px-5 py-[16px] md:px-10 md:py-[20px]',
          'transition-[background-color,color,border-color] duration-[400ms] ease-out',
          'border-b',
          isSolid
            ? 'bg-[var(--color-paper)] text-[var(--color-ink)] border-[var(--color-rule)]'
            : 'bg-transparent text-[var(--color-paper)] border-transparent',
        ].join(' ')}
      >
        <Link
          href="/"
          data-track="nav_logo"
          className="font-display text-[13px] md:text-[14px] font-bold tracking-[0.06em] uppercase hover:text-signal transition-colors"
        >
          Manifest Office
        </Link>

        {/* Desktop link list — hidden below `md`. */}
        <ul className="hidden md:flex justify-center gap-8">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                data-cursor
                data-track="nav_link"
                data-track-label={link.label.toLowerCase()}
                data-track-surface="desktop"
                className="group/nav flex flex-col items-center leading-none transition-colors hover:text-signal"
              >
                <span className="text-[13px] tracking-[0.02em]">{link.label}</span>
                <span className="mt-[3px] font-mono text-[9px] uppercase tracking-[0.08em] text-[#9CAA98] transition-colors group-hover/nav:text-signal">
                  {link.sublabel}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {/* Spacer for the grid column when desktop links are hidden. */}
        <div className="md:hidden" />

        <div className="flex items-center justify-end gap-3 md:gap-[18px]">
          <span className="hidden md:inline font-mono text-[11px] tracking-[0.04em] uppercase">
            EN · EUR
          </span>
          <WishlistBadge />
          <CartBadge />
          {/* Hamburger — visible only below `md`. */}
          <button
            type="button"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={handleMenuToggle}
            className="md:hidden ml-1 -mr-1 inline-flex h-9 w-9 items-center justify-center text-current"
          >
            <span aria-hidden="true" className="relative block h-3 w-5">
              <span
                className={`absolute left-0 right-0 block h-px bg-current transition-all duration-300 ${menuOpen ? 'top-1/2 rotate-45' : 'top-0'}`}
              />
              <span
                className={`absolute left-0 right-0 block h-px bg-current transition-all duration-300 ${menuOpen ? 'opacity-0' : 'top-1/2'}`}
              />
              <span
                className={`absolute left-0 right-0 block h-px bg-current transition-all duration-300 ${menuOpen ? 'top-1/2 -rotate-45' : 'bottom-0'}`}
              />
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay — paper-on-ink full screen, slides in from the
          top with a 240ms ease. Visible only when the hamburger is toggled. */}
      <div
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        aria-hidden={!menuOpen}
        className={[
          'fixed inset-x-0 top-[calc(36px+57px)] bottom-0 z-40 md:hidden',
          'bg-[#0B0F0E] text-[#F2EFE8]',
          'transition-[opacity,transform] duration-[280ms] ease-out',
          menuOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-2 pointer-events-none',
        ].join(' ')}
      >
        <ul className="flex flex-col px-5 py-6">
          {NAV_LINKS.map((link) => (
            <li key={link.href} className="border-b border-[rgba(242,239,232,0.12)]">
              <Link
                href={link.href}
                onClick={() => setMenuOpen(false)}
                data-track="nav_link"
                data-track-label={link.label.toLowerCase()}
                data-track-surface="mobile"
                className="flex flex-col gap-1 py-5 transition-colors hover:text-signal"
              >
                <span className="font-display text-[28px] font-bold leading-none tracking-[-0.01em]">
                  {link.label}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#9CAA98]">
                  {link.sublabel}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="px-5 pt-8 font-mono text-[11px] tracking-[0.06em] uppercase text-[#5C6B5A]">
          EN · EUR · EDITION 01 · ISSUED FROM PORTO
        </div>
      </div>
    </>
  );
}
