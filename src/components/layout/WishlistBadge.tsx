'use client';

import { useEffect, useState } from 'react';

import { useWishlist } from '@/hooks/use-wishlist';
import { CUSTOM_EVENTS, track } from '@/lib/analytics';

import type { ReactElement } from 'react';

export function WishlistBadge(): ReactElement {
  const { count, openDrawer } = useWishlist();

  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [pulse, setPulse] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    function onAdded(): void {
      setPulse(false);
      window.requestAnimationFrame(() => setPulse(true));
      window.setTimeout(() => setPulse(false), 600);
    }
    window.addEventListener('mo:wishlist-added', onAdded);
    return () => window.removeEventListener('mo:wishlist-added', onAdded);
  }, []);

  const displayedCount = isMounted ? count : 0;

  function handleClick(): void {
    track(CUSTOM_EVENTS.wishlistDrawerOpen, {
      params: { source: 'header_badge', count: displayedCount },
    });
    openDrawer();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      data-cursor
      data-pulse={pulse ? 'on' : 'off'}
      className="mo-wish-badge flex items-center gap-[6px] text-[12px] hover:text-signal transition-colors bg-transparent border-0 p-0 cursor-pointer"
      aria-label={`Open wishlist, ${displayedCount} ${displayedCount === 1 ? 'item' : 'items'}`}
    >
      <svg
        viewBox="0 0 24 24"
        width="13"
        height="13"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      <span
        className="wish-count font-mono tracking-[0.04em]"
        style={{ color: 'var(--color-signal)' }}
      >
        [{displayedCount}]
      </span>
      <style>{`
        .mo-wish-badge[data-pulse='on'] svg,
        .mo-wish-badge[data-pulse='on'] .wish-count {
          animation: mo-wish-pulse 600ms cubic-bezier(0.22, 1, 0.36, 1);
          display: inline-block;
        }
        @keyframes mo-wish-pulse {
          0%   { transform: scale(1);    color: var(--color-signal); }
          30%  { transform: scale(1.35); color: #D24A1F; }
          60%  { transform: scale(0.95); color: #D24A1F; }
          100% { transform: scale(1);    color: var(--color-signal); }
        }
        @media (prefers-reduced-motion: reduce) {
          .mo-wish-badge[data-pulse='on'] svg,
          .mo-wish-badge[data-pulse='on'] .wish-count { animation: none; }
        }
      `}</style>
    </button>
  );
}
