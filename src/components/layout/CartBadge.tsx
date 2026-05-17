/**
 * Header cart badge — `CART [N]`.
 *
 * Subscribes to the global cart store via `useCart()`. On click it opens the
 * global `CartDrawer` (drawer-first UX, matching every modern Shopify
 * theme). The canonical `/cart` full-page review is still reachable via the
 * "View full manifest" link inside the drawer.
 *
 * SSR: renders `[0]` on the server (the cart starts empty). Hydration
 * reconciles to whatever the store has in `sessionStorage`.
 */

'use client';

import { useEffect, useState } from 'react';

import { useCart } from '@/hooks/use-cart';

import type { ReactElement } from 'react';

export function CartBadge(): ReactElement {
  const { count, openDrawer } = useCart();

  // Avoid a hydration mismatch when the server renders 0 but the client has a
  // persisted cart — defer to client value after mount.
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const displayedCount = isMounted ? count : 0;

  return (
    <button
      type="button"
      onClick={openDrawer}
      data-cursor
      className="flex items-center gap-[6px] text-[12px] hover:text-signal transition-colors bg-transparent border-0 p-0 cursor-pointer"
      aria-label={`Open manifest, ${displayedCount} ${displayedCount === 1 ? 'item' : 'items'}`}
    >
      <span className="font-mono tracking-[0.04em] uppercase">CART</span>
      <span
        id="cart-count"
        className="cart-count font-mono tracking-[0.04em]"
        style={{ color: 'var(--color-signal)' }}
      >
        [{displayedCount}]
      </span>
    </button>
  );
}
