/**
 * Header cart badge — `CART [N]`.
 *
 * Subscribes to the global cart store via `useCart()`. On click it routes to
 * `/cart` (the canonical Shopify cart page per `docs/routing.md`). PDP
 * Wave-2 may override this with an in-page drawer; for layout-shell purposes
 * the link always points to the cart route so it works on every page.
 *
 * SSR: renders `[0]` on the server (the cart starts empty). Hydration
 * reconciles to whatever the store has in `sessionStorage`.
 */

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useCart } from '@/hooks/use-cart';

import type { ReactElement } from 'react';

export function CartBadge(): ReactElement {
  const { count } = useCart();

  // Avoid a hydration mismatch when the server renders 0 but the client has a
  // persisted cart — defer to client value after mount.
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const displayedCount = isMounted ? count : 0;

  return (
    <Link
      href="/cart"
      data-cursor
      className="flex items-center gap-[6px] text-[12px] hover:text-[var(--color-signal)] transition-colors"
      aria-label={`Cart, ${displayedCount} ${displayedCount === 1 ? 'item' : 'items'}`}
    >
      <span className="font-mono tracking-[0.04em] uppercase">CART</span>
      <span
        id="cart-count"
        className="cart-count font-mono tracking-[0.04em]"
        style={{ color: 'var(--color-signal)' }}
      >
        [{displayedCount}]
      </span>
    </Link>
  );
}
