/**
 * Global cart drawer — slide-in-from-right, mounted in `app/layout.tsx`.
 *
 * Visible on every route, opens via `useCart().openDrawer()`:
 *  - Header `CartBadge` click.
 *  - After a successful reserve (Wave 3A Buybox calls `openDrawer()` post-
 *    `add()`).
 *  - Programmatic opens from the desk recommender etc.
 *
 * Layout ported from `deploy/pdp.html` lines 395–540 (CSS) and 1103–1140
 * (markup). Visual rules:
 *  - 440px wide, paper background, ink-12 left shadow rule.
 *  - 1px progress bar (free-shipping threshold from `commerce.ts`).
 *  - Quiet meta row: "add €X for free shipping" + cutoff countdown.
 *  - Item list with hard rules between rows.
 *  - Up to 2 upsell cards (products not in cart).
 *  - Email capture (writes Klaviyo `Manifest Email Saved` event).
 *  - Total + "Manifest complete" CTA → fires `Manifest Complete Clicked`.
 *
 * Coordination:
 *  - Drawer open/close is a Zustand slice (`isDrawerOpen`). NOT persisted —
 *    re-opening the drawer after a page nav would be confusing UX.
 *  - Wave 3A (Buybox) must call `useCart().openDrawer()` after a reserve.
 */

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

import { CartItemRow } from '@/components/sections/CartItemRow';
import { useCart } from '@/hooks/use-cart';
import {
  CUTOFF_HOUR,
  FLAT_SHIPPING_EUR,
  FREE_SHIP_THRESHOLD,
  TIMEZONE_OFFSET_HOURS,
} from '@/lib/constants/commerce';
import { toStorefrontHandle } from '@/lib/shopify/handle';

import type { CartItem } from '@/lib/state/cart';
import type { ManifestProduct, ProductsResponse } from '@/lib/types/product';
import type { ReactElement } from 'react';

const ANON_STORAGE_KEY = 'mo_anon';
const EMAIL_STORAGE_KEY = 'mo_email';
const COUNTDOWN_REFRESH_MS = 30_000;

type CutoffParts = {
  readonly hours: number;
  readonly minutes: number;
};

function computeCutoff(): CutoffParts {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000;
  const cet = new Date(utcMs + TIMEZONE_OFFSET_HOURS * 3_600_000);
  const target = new Date(cet);
  target.setHours(CUTOFF_HOUR, 0, 0, 0);
  if (target <= cet) target.setDate(target.getDate() + 1);
  const diffMs = target.getTime() - cet.getTime();
  const hours = Math.floor(diffMs / 3_600_000);
  const minutes = Math.floor((diffMs % 3_600_000) / 60_000);
  return { hours, minutes };
}

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
    /* quota / privacy mode — silently drop. */
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
          page: typeof window === 'undefined' ? '/' : window.location.pathname,
        },
      }),
    });
  } catch {
    /* tracking is fire-and-forget; never block UX on Klaviyo. */
  }
}

export function CartDrawer(): ReactElement | null {
  const { items, subtotalEur, isDrawerOpen, closeDrawer, add: addCartItem, removeLine } = useCart();

  const [isMounted, setIsMounted] = useState(false);
  const [cutoff, setCutoff] = useState<CutoffParts>(() => ({ hours: 0, minutes: 0 }));
  const [upsells, setUpsells] = useState<readonly ManifestProduct[]>([]);
  const [email, setEmail] = useState('');
  const [isEmailSaved, setIsEmailSaved] = useState(false);
  const anonymousIdRef = useRef<string>('');
  const emailInputId = useId();

  // Mount-time bootstrap: anonymous id + persisted email + first countdown
  // sample. Single effect — no further reads of localStorage during render.
  useEffect(() => {
    setIsMounted(true);
    anonymousIdRef.current = ensureAnonymousId();
    const savedEmail = readLocalStorage(EMAIL_STORAGE_KEY);
    if (savedEmail && savedEmail.length > 0) {
      setEmail(savedEmail);
      setIsEmailSaved(true);
    }
    setCutoff(computeCutoff());
    const handle = window.setInterval(() => setCutoff(computeCutoff()), COUNTDOWN_REFRESH_MS);
    return () => window.clearInterval(handle);
  }, []);

  // Fetch upsell catalogue once — same `/api/products` the rest of the
  // storefront uses. Drawer-local: if the fetch fails, the upsell row hides.
  useEffect(() => {
    if (!isMounted) return;
    const abort = new AbortController();
    void (async (): Promise<void> => {
      try {
        const response = await fetch('/api/products', { signal: abort.signal });
        if (!response.ok) return;
        const payload = (await response.json()) as ProductsResponse;
        if (Array.isArray(payload.products)) setUpsells(payload.products);
      } catch {
        /* silent — upsells are a nice-to-have. */
      }
    })();
    return () => abort.abort();
  }, [isMounted]);

  // Body scroll lock when the drawer is open. Restores prior `overflow` so we
  // don't trample a value some other component set.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (!isDrawerOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isDrawerOpen]);

  // Esc-to-close.
  useEffect(() => {
    if (!isDrawerOpen) return;
    function onKey(event: KeyboardEvent): void {
      if (event.key === 'Escape') closeDrawer();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isDrawerOpen, closeDrawer]);

  // Fire "Viewed Cart Drawer" once per open transition.
  useEffect(() => {
    if (!isDrawerOpen || !isMounted) return;
    const persistedEmail = readLocalStorage(EMAIL_STORAGE_KEY);
    void postTrack('Viewed Cart Drawer', anonymousIdRef.current, persistedEmail, {
      cart_item_count: items.length,
      cart_subtotal: subtotalEur,
    });
    // We track once per open; intentionally not depending on items.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDrawerOpen, isMounted]);

  const progress = useMemo(() => {
    const subtotal = subtotalEur;
    const away = Math.max(0, FREE_SHIP_THRESHOLD - subtotal);
    const pct = Math.min(100, (subtotal / FREE_SHIP_THRESHOLD) * 100);
    const freeShip = subtotal >= FREE_SHIP_THRESHOLD;
    return { away, pct, freeShip };
  }, [subtotalEur]);

  const upsellCandidates = useMemo(() => {
    const inCart = new Set(items.map((item) => item.handle));
    return upsells.filter((product) => !inCart.has(toStorefrontHandle(product.handle))).slice(0, 2);
  }, [upsells, items]);

  const totalWithShipping = progress.freeShip ? subtotalEur : subtotalEur + FLAT_SHIPPING_EUR;

  const handleUpsellClick = useCallback(
    (product: ManifestProduct): void => {
      const storefrontHandle = toStorefrontHandle(product.handle);
      const cartItem: CartItem = {
        handle: storefrontHandle,
        title: product.title,
        price: product.price,
        imageUrl: product.image ?? product.images[0]?.url ?? '',
      };
      addCartItem(cartItem);
      void postTrack(
        'Added Upsell To Manifest',
        anonymousIdRef.current,
        readLocalStorage(EMAIL_STORAGE_KEY),
        {
          product_handle: storefrontHandle,
          product_title: product.title,
          product_price: product.price,
          cart_item_count: items.length + 1,
        },
      );
    },
    [addCartItem, items.length],
  );

  const handleEmailSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>): void => {
      event.preventDefault();
      const trimmed = email.trim();
      if (trimmed.length === 0 || !trimmed.includes('@')) return;
      writeLocalStorage(EMAIL_STORAGE_KEY, trimmed);
      setIsEmailSaved(true);
      void postTrack('Manifest Email Saved', anonymousIdRef.current, trimmed, {
        email_captured: true,
        cart_item_count: items.length,
        cart_subtotal: subtotalEur,
        interested_in_edition: '01',
      });
    },
    [email, items.length, subtotalEur],
  );

  const handleManifestComplete = useCallback((): void => {
    void postTrack(
      'Manifest Complete Clicked',
      anonymousIdRef.current,
      readLocalStorage(EMAIL_STORAGE_KEY),
      {
        cart_item_count: items.length,
        cart_subtotal: subtotalEur,
        cart_total: totalWithShipping,
        free_shipping_unlocked: progress.freeShip,
      },
    );
  }, [items.length, subtotalEur, totalWithShipping, progress.freeShip]);

  // Hydration safety: server renders nothing for the drawer's open state.
  // Once mounted, the closed state is rendered (transformed off-canvas) so
  // the open transition still animates on first open.
  if (!isMounted) return null;

  const cartIsEmpty = items.length === 0;
  const microShipText = progress.freeShip
    ? '— free shipping'
    : `— add €${Math.ceil(progress.away)} for free shipping`;
  const microCutoffText = `— next-day if ordered in ${cutoff.hours}h ${String(cutoff.minutes).padStart(2, '0')}m`;

  return (
    <>
      {/* Scrim */}
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onClick={closeDrawer}
        className={[
          'fixed inset-0 z-[800] bg-[rgba(11,15,14,0.42)] cursor-default',
          'transition-opacity duration-[320ms] ease-out',
          isDrawerOpen ? 'opacity-100 visible' : 'opacity-0 invisible delay-[320ms]',
        ].join(' ')}
      />

      <aside
        aria-label="Your manifest"
        aria-hidden={!isDrawerOpen}
        className={[
          'fixed right-0 top-0 z-[900] flex h-screen w-[min(440px,100vw)] flex-col',
          'bg-[var(--color-paper)] text-[var(--color-ink)]',
          'shadow-[-1px_0_0_var(--color-rule)]',
          'transition-transform duration-[520ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        {/* Head */}
        <div className="flex items-baseline justify-between px-9 pb-6 pt-9">
          <h3 className="font-display text-[22px] font-medium leading-none tracking-[-0.01em]">
            Manifest
          </h3>
          <button
            type="button"
            onClick={closeDrawer}
            className="bg-transparent p-0 font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--color-lichen)] hover:text-[var(--color-ink)] transition-colors"
          >
            Close
          </button>
        </div>

        {/* Progress whisper */}
        <div className="relative mx-9 h-px bg-[var(--color-rule)]">
          <div
            className={[
              'absolute left-0 top-0 bottom-0',
              'transition-[width] duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
              progress.freeShip ? 'bg-[var(--color-ink)]' : 'bg-[var(--color-signal)]',
            ].join(' ')}
            style={{ width: `${progress.pct}%` }}
          />
        </div>

        {/* Micro */}
        <div className="flex flex-col gap-1 px-9 pb-1 pt-[14px] font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-lichen)]">
          <span
            className={progress.freeShip ? 'text-[var(--color-lichen)]' : 'text-[var(--color-ink)]'}
          >
            {microShipText}
          </span>
          <span>{microCutoffText}</span>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-9 pb-2 pt-7">
          {cartIsEmpty ? (
            <div className="py-6 font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--color-lichen)]">
              Empty
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-rule)]">
              {items.map((item) => (
                <CartItemRow
                  key={`${item.handle}::${item.engraving?.text ?? ''}`}
                  item={item}
                  variant="drawer"
                  onRemove={(removed) => removeLine(removed.handle, removed.engraving?.text)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Upsells */}
        {!cartIsEmpty && upsellCandidates.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto px-9 py-6" style={{ scrollbarWidth: 'none' }}>
            {upsellCandidates.map((product) => (
              <button
                type="button"
                key={product.handle}
                onClick={() => handleUpsellClick(product)}
                className="flex w-[110px] flex-shrink-0 flex-col gap-2 text-left opacity-85 transition-opacity hover:opacity-100"
              >
                <div className="aspect-square overflow-hidden">
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.title}
                      width={220}
                      height={220}
                      sizes="110px"
                      className="h-full w-full object-cover transition-transform duration-[600ms] ease-out hover:scale-[1.04]"
                    />
                  ) : null}
                </div>
                <div className="font-display text-[12px] font-medium leading-[1.2]">
                  {product.title}
                </div>
                <div className="font-mono text-[11px] text-[var(--color-lichen)]">
                  €{Math.round(product.price)}
                </div>
              </button>
            ))}
          </div>
        ) : null}

        {/* Total */}
        <div className="flex items-baseline justify-between px-9 pb-4 pt-7">
          <span className="font-display text-[28px] font-medium leading-none tracking-[-0.015em]">
            €{Math.round(totalWithShipping)}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-lichen)]">
            {progress.freeShip ? '— shipping included' : `— €${FLAT_SHIPPING_EUR} shipping`}
          </span>
        </div>

        {/* Email capture */}
        <div className="px-9 pt-2">
          <form
            onSubmit={handleEmailSubmit}
            className="flex items-stretch border border-[var(--color-rule-strong)]"
          >
            <label htmlFor={emailInputId} className="sr-only">
              Save manifest by email
            </label>
            <input
              id={emailInputId}
              type="email"
              required
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setIsEmailSaved(false);
              }}
              placeholder="email · save manifest"
              className="flex-1 border-0 bg-transparent px-4 py-[14px] font-mono text-[12px] tracking-[0.02em] text-[var(--color-ink)] outline-none placeholder:text-[var(--color-lichen)] focus:bg-[rgba(11,15,14,0.02)]"
            />
            <button
              type="submit"
              className="border-0 border-l border-[var(--color-rule-strong)] bg-transparent px-5 font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--color-ink)] transition-colors hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)]"
            >
              {isEmailSaved ? '✓ Saved' : 'Save'}
            </button>
          </form>
          {isEmailSaved ? (
            <div className="pt-[10px] font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-lichen)]">
              Saved.
            </div>
          ) : null}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 px-9 pb-9 pt-2">
          <button
            type="button"
            disabled={cartIsEmpty}
            onClick={handleManifestComplete}
            className="w-full bg-[var(--color-ink)] px-4 py-[18px] font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-paper)] transition-[background-color,letter-spacing] duration-[360ms] ease-out hover:bg-[var(--color-signal)] hover:tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[var(--color-ink)] disabled:hover:tracking-[0.14em]"
          >
            Manifest complete
          </button>
          <Link
            href="/cart"
            onClick={closeDrawer}
            className="text-center font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-lichen)] hover:text-[var(--color-signal)] transition-colors"
          >
            View full manifest
          </Link>
        </div>
      </aside>
    </>
  );
}
