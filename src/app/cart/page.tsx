/**
 * `/cart` — full-page manifest review.
 *
 * Shopify-canonical cart route. Same data source as `CartDrawer` but
 * rendered as a real page (not an overlay). Useful for users who prefer the
 * full-page review experience or who reach `/cart` via direct link.
 *
 * Client-only: the cart lives in `sessionStorage`. We render a skeleton on
 * the server (so the route is statically routable and SEO-safe) and hydrate
 * the items after mount, mirroring the `CartBadge` pattern.
 */

'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

import { CartItemRow } from '@/components/sections/CartItemRow';
import { useCart } from '@/hooks/use-cart';
import { FLAT_SHIPPING_EUR, FREE_SHIP_THRESHOLD } from '@/lib/constants/commerce';

import type { ReactElement } from 'react';

const ANON_STORAGE_KEY = 'mo_anon';
const EMAIL_STORAGE_KEY = 'mo_email';

function readLocalStorage(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocalStorage(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

function ensureAnonymousId(): string {
  const existing = readLocalStorage(ANON_STORAGE_KEY);
  if (existing && existing.length > 0) return existing;
  const fresh = `anon_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  writeLocalStorage(ANON_STORAGE_KEY, fresh);
  return fresh;
}

type TrackProperties = Record<string, string | number | boolean | null>;

async function postTrack(
  event: string,
  anonymousId: string,
  email: string | null,
  properties: TrackProperties,
): Promise<void> {
  try {
    await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event,
        anonymousId,
        email,
        properties: {
          ...properties,
          source: 'manifest-office-demo',
          page: typeof window === 'undefined' ? '/cart' : window.location.pathname,
        },
      }),
    });
  } catch {
    /* fire-and-forget */
  }
}

export default function CartPage(): ReactElement {
  const { items, subtotalEur, removeLine } = useCart();
  const [isMounted, setIsMounted] = useState(false);
  const anonymousIdRef = useRef<string>('');

  useEffect(() => {
    setIsMounted(true);
    anonymousIdRef.current = ensureAnonymousId();
  }, []);

  const freeShip = subtotalEur >= FREE_SHIP_THRESHOLD;
  const shipping = freeShip ? 0 : FLAT_SHIPPING_EUR;
  const total = subtotalEur + shipping;

  const handleManifestComplete = useCallback((): void => {
    void postTrack(
      'Manifest Complete Clicked',
      anonymousIdRef.current,
      readLocalStorage(EMAIL_STORAGE_KEY),
      {
        cart_item_count: items.length,
        cart_subtotal: subtotalEur,
        cart_total: total,
        free_shipping_unlocked: freeShip,
        from: 'cart_page',
      },
    );
  }, [items.length, subtotalEur, total, freeShip]);

  if (!isMounted) {
    return (
      <div className="mx-auto max-w-[1280px] px-10 pb-24 pt-[140px]">
        <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--color-lichen)]">
          Loading manifest…
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-[760px] px-10 pb-24 pt-[140px] text-center">
        <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--color-signal)]">
          MANIFEST · EMPTY
        </span>
        <h1 className="mt-4 font-display text-[56px] font-medium leading-[1.05] tracking-[-0.015em] text-[var(--color-ink)]">
          Manifest is empty
        </h1>
        <p className="mx-auto mt-6 max-w-[44ch] text-[16px] leading-[1.6] text-[var(--color-lichen)]">
          Brief the desk to compose a system tailored to a place, a duration, and a working
          register.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link
            href="/products/manifest-tech-pouch-m#desk"
            className="bg-[var(--color-ink)] px-6 py-[14px] font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-paper)] transition-[background-color,letter-spacing] hover:bg-[var(--color-signal)] hover:tracking-[0.18em]"
          >
            Brief the desk
          </Link>
          <Link
            href="/collections/edition-01"
            className="border border-[var(--color-rule-strong)] px-6 py-[14px] font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-ink)] transition-colors hover:border-[var(--color-ink)]"
          >
            Browse dossiers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1280px] px-10 pb-24 pt-[140px]">
      <header className="mb-12 flex flex-col gap-3">
        <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--color-signal)]">
          MANIFEST · YOUR ORDER
        </span>
        <h1 className="font-display text-[56px] font-medium leading-none tracking-[-0.015em] text-[var(--color-ink)]">
          Manifest
        </h1>
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--color-lichen)]">
          {items.length} {items.length === 1 ? 'dossier' : 'dossiers'} reserved · Edition 01
        </p>
      </header>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[3fr_2fr]">
        {/* Items column */}
        <section aria-label="Reserved dossiers">
          <div className="border-t border-[var(--color-rule)]">
            {items.map((item) => (
              <CartItemRow
                key={`${item.handle}::${item.engraving?.text ?? ''}`}
                item={item}
                variant="page"
                onRemove={(removed) => removeLine(removed.handle, removed.engraving?.text)}
              />
            ))}
          </div>
          <Link
            href="/collections/edition-01"
            className="mt-8 inline-block font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--color-lichen)] hover:text-[var(--color-signal)] transition-colors"
          >
            ← Continue browsing
          </Link>
        </section>

        {/* Summary column */}
        <aside
          aria-label="Order summary"
          className="self-start border border-[var(--color-rule)] bg-[var(--color-paper)] p-9"
        >
          <h2 className="font-display text-[22px] font-medium leading-none tracking-[-0.01em] text-[var(--color-ink)]">
            Summary
          </h2>

          <dl className="mt-7 flex flex-col gap-4 border-t border-[var(--color-rule)] pt-6">
            <div className="flex items-baseline justify-between">
              <dt className="font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--color-lichen)]">
                Subtotal
              </dt>
              <dd className="font-mono text-[14px] text-[var(--color-ink)]">
                €{Math.round(subtotalEur)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between">
              <dt className="font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--color-lichen)]">
                Shipping
              </dt>
              <dd className="font-mono text-[14px] text-[var(--color-ink)]">
                {freeShip ? 'Included' : `€${FLAT_SHIPPING_EUR}`}
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex items-baseline justify-between border-t border-[var(--color-rule)] pt-6">
            <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--color-lichen)]">
              Total
            </span>
            <span className="font-display text-[32px] font-medium leading-none tracking-[-0.015em] text-[var(--color-ink)]">
              €{Math.round(total)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleManifestComplete}
            className="mt-8 w-full bg-[var(--color-ink)] px-4 py-[18px] font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-paper)] transition-[background-color,letter-spacing] duration-[360ms] ease-out hover:bg-[var(--color-signal)] hover:tracking-[0.18em]"
          >
            Manifest complete
          </button>

          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-lichen)]">
            Each dossier is uniquely issued. Quantity is fixed at one per reservation.
          </p>
        </aside>
      </div>
    </div>
  );
}
