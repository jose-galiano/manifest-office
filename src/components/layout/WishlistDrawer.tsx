'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';

import { reserveProductAction } from '@/app/products/[handle]/actions';
import { useCart } from '@/hooks/use-cart';
import { useWishlist } from '@/hooks/use-wishlist';
import { CUSTOM_EVENTS, ECOMMERCE_EVENTS, track } from '@/lib/analytics';
import { toStorefrontHandle } from '@/lib/shopify/handle';

import type { ManifestProduct, ProductsResponse } from '@/lib/types/product';
import type { ReactElement } from 'react';

type AllocationMap = Readonly<Record<string, { issued: number; total: number }>>;

export function WishlistDrawer(): ReactElement {
  const {
    items,
    isDrawerOpen,
    sharedHandles,
    closeDrawer,
    remove,
    clear,
    add: addToWishlist,
  } = useWishlist();
  const { closeDrawer: closeCart, openDrawer: openCart, add: addToCart } = useCart();
  const [allocations, setAllocations] = useState<AllocationMap>({});
  const [shareState, setShareState] = useState<'idle' | 'copied' | 'error'>('idle');
  const [pendingHandle, setPendingHandle] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [sharedItems, setSharedItems] = useState<readonly ManifestProduct[]>([]);

  const isShared = sharedHandles !== null;

  useEffect(() => {
    if (!isDrawerOpen) return;
    closeCart();
    track(CUSTOM_EVENTS.wishlistDrawerOpen, { params: { count: items.length } });
  }, [closeCart, isDrawerOpen, items.length]);

  useEffect(() => {
    if (!isDrawerOpen) return;
    function onKey(event: KeyboardEvent): void {
      if (event.key === 'Escape') closeDrawer();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [closeDrawer, isDrawerOpen]);

  useEffect(() => {
    if (!isDrawerOpen) return;
    const abort = new AbortController();
    fetch('/api/products', { signal: abort.signal, cache: 'no-store' })
      .then((res) => (res.ok ? (res.json() as Promise<ProductsResponse>) : null))
      .then((payload) => {
        if (!payload) return;
        const map: Record<string, { issued: number; total: number }> = {};
        const list: ManifestProduct[] = [];
        for (const product of payload.products) {
          const storefrontHandle = toStorefrontHandle(product.handle);
          map[storefrontHandle] = { issued: product.editionIssued, total: product.editionTotal };
          if (sharedHandles?.includes(storefrontHandle)) list.push(product);
        }
        setAllocations(map);
        if (sharedHandles) setSharedItems(list);
      })
      .catch(() => undefined);
    return () => abort.abort();
  }, [isDrawerOpen, sharedHandles]);

  const visibleItems = useMemo(() => {
    if (isShared) {
      return sharedItems.map((product) => ({
        handle: toStorefrontHandle(product.handle),
        title: product.title,
        priceEur: product.price,
        imageUrl: product.image ?? product.images[0]?.url ?? '',
        addedAt: 0,
      }));
    }
    return items;
  }, [isShared, items, sharedItems]);

  const reserveItem = useCallback(
    (handle: string, title: string, priceEur: number, imageUrl: string) => {
      setPendingHandle(handle);
      startTransition(async () => {
        const result = await reserveProductAction(handle, null);
        setPendingHandle(null);
        if (!result.ok) return;
        if ('sold_out' in result.data) return;
        const reservation = result.data;

        addToCart({
          handle,
          title,
          price: priceEur,
          imageUrl,
          issuedAs: reservation.issue,
        });

        track(CUSTOM_EVENTS.wishlistReserve, {
          params: { handle, source: 'wishlist_drawer' },
        });
        track(ECOMMERCE_EVENTS.addToCart, {
          ecommerce: {
            currency: 'EUR',
            value: priceEur,
            items: [
              {
                item_id: handle,
                item_name: title,
                item_brand: 'Manifest Office',
                price: priceEur,
                quantity: 1,
                currency: 'EUR',
              },
            ],
          },
          params: { issue: reservation.issue, source: 'wishlist_drawer' },
          fanout: { klaviyo: true },
        });

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('mo:cart-added'));
        }
        remove(handle);
        closeDrawer();
        openCart();
      });
    },
    [addToCart, closeDrawer, openCart, remove],
  );

  const handleShare = useCallback(async () => {
    if (typeof window === 'undefined' || items.length === 0) return;
    const handles = items.map((entry) => entry.handle).join(',');
    const url = `${window.location.origin}/?w=${encodeURIComponent(handles)}`;
    track(CUSTOM_EVENTS.wishlistShare, { params: { count: items.length } });

    try {
      if (navigator.share) {
        await navigator.share({ title: 'My Manifest Office wishlist', url });
        setShareState('copied');
      } else {
        await navigator.clipboard.writeText(url);
        setShareState('copied');
      }
      window.setTimeout(() => setShareState('idle'), 2400);
    } catch {
      setShareState('error');
      window.setTimeout(() => setShareState('idle'), 2400);
    }
  }, [items]);

  const handleSaveSharedToMine = useCallback(() => {
    for (const entry of visibleItems) {
      addToWishlist({
        handle: entry.handle,
        title: entry.title,
        priceEur: entry.priceEur,
        imageUrl: entry.imageUrl,
      });
    }
  }, [addToWishlist, visibleItems]);

  return (
    <>
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onClick={closeDrawer}
        className={[
          'fixed inset-0 z-[800] cursor-default bg-[rgba(11,15,14,0.42)]',
          'transition-opacity duration-[320ms] ease-out',
          isDrawerOpen ? 'visible opacity-100' : 'invisible opacity-0 delay-[320ms]',
        ].join(' ')}
      />

      <aside
        aria-label="Your wishlist"
        inert={!isDrawerOpen}
        className={[
          'fixed right-0 top-0 z-[900] flex h-dvh w-[min(440px,100vw)] flex-col',
          'bg-[var(--color-paper)] text-[var(--color-ink)]',
          'shadow-[-1px_0_0_var(--color-rule)]',
          'transition-transform duration-[520ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        <div className="flex items-baseline justify-between px-9 pb-6 pt-9">
          <div className="flex flex-col gap-1">
            <h3 className="font-display text-[22px] font-medium leading-none tracking-[-0.01em]">
              {isShared ? 'Shared with you' : 'Wishlist'}
            </h3>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-lichen)]">
              {visibleItems.length} {visibleItems.length === 1 ? 'item' : 'items'}
              {isShared ? ' · preview' : ''}
            </span>
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            className="border-0 bg-transparent p-0 font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--color-lichen)] transition-colors hover:text-[var(--color-ink)]"
          >
            Close
          </button>
        </div>

        <div className="mx-9 h-px bg-[var(--color-rule)]" />

        <div className="min-h-0 flex-1 overflow-y-auto px-9 py-5">
          {visibleItems.length === 0 ? (
            <EmptyState onBrowse={closeDrawer} />
          ) : (
            <ul className="flex flex-col gap-5">
              {visibleItems.map((entry) => {
                const allocation = allocations[entry.handle];
                const remaining = allocation
                  ? Math.max(0, allocation.total - allocation.issued)
                  : null;
                return (
                  <WishlistRow
                    key={entry.handle}
                    handle={entry.handle}
                    title={entry.title}
                    priceEur={entry.priceEur}
                    imageUrl={entry.imageUrl}
                    remaining={remaining}
                    isShared={isShared}
                    isPending={pendingHandle === entry.handle}
                    onClose={closeDrawer}
                    onReserve={() =>
                      reserveItem(entry.handle, entry.title, entry.priceEur, entry.imageUrl)
                    }
                    onRemove={() => remove(entry.handle)}
                  />
                );
              })}
            </ul>
          )}
        </div>

        {visibleItems.length > 0 ? (
          <DrawerFooter
            isShared={isShared}
            shareState={shareState}
            onShare={handleShare}
            onClear={clear}
            onSaveShared={handleSaveSharedToMine}
          />
        ) : null}
      </aside>
    </>
  );
}

type WishlistRowProps = {
  readonly handle: string;
  readonly title: string;
  readonly priceEur: number;
  readonly imageUrl: string;
  readonly remaining: number | null;
  readonly isShared: boolean;
  readonly isPending: boolean;
  readonly onClose: () => void;
  readonly onReserve: () => void;
  readonly onRemove: () => void;
};

function WishlistRow({
  handle,
  title,
  priceEur,
  imageUrl,
  remaining,
  isShared,
  isPending,
  onClose,
  onReserve,
  onRemove,
}: WishlistRowProps): ReactElement {
  const lowStock = remaining !== null && remaining < 80;
  const soldOut = remaining === 0;
  return (
    <li className="grid grid-cols-[80px_1fr] gap-4 border-b border-[var(--color-rule)] pb-5 last:border-b-0">
      <Link
        href={`/products/${handle}`}
        onClick={onClose}
        className="aspect-[4/5] overflow-hidden bg-[#eae5dc]"
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            width={200}
            height={250}
            sizes="80px"
            className="h-full w-full object-cover"
          />
        ) : null}
      </Link>
      <div className="flex flex-col">
        <Link
          href={`/products/${handle}`}
          onClick={onClose}
          className="font-display text-[17px] font-medium leading-tight tracking-tight text-[var(--color-ink)] transition-colors hover:text-[var(--color-signal)]"
        >
          {title}
        </Link>
        <span className="mt-1 font-mono text-[12px] text-[var(--color-ink)]">
          €{Math.round(priceEur)}
        </span>
        {remaining !== null ? (
          <span
            className={`mt-1 font-mono text-[10px] uppercase tracking-[0.06em] ${
              lowStock ? 'text-[var(--color-signal)]' : 'text-[var(--color-lichen)]'
            }`}
          >
            {soldOut ? 'sold out' : `${remaining} remaining`}
          </span>
        ) : null}
        {!isShared ? (
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={onReserve}
              disabled={isPending || soldOut}
              className="rounded-full bg-[#A8350F] px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--color-paper)] transition-colors hover:bg-[#B83C16] disabled:cursor-default disabled:opacity-60"
            >
              {isPending ? 'Reserving…' : soldOut ? 'Sold out' : 'Reserve'}
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="border-0 bg-transparent p-0 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-lichen)] transition-colors hover:text-[var(--color-ink)]"
            >
              Remove
            </button>
          </div>
        ) : null}
      </div>
    </li>
  );
}

type ShareState = 'idle' | 'copied' | 'error';

function DrawerFooter({
  isShared,
  shareState,
  onShare,
  onClear,
  onSaveShared,
}: {
  readonly isShared: boolean;
  readonly shareState: ShareState;
  readonly onShare: () => void;
  readonly onClear: () => void;
  readonly onSaveShared: () => void;
}): ReactElement {
  const shareLabel =
    shareState === 'copied'
      ? 'Link copied ✓'
      : shareState === 'error'
        ? 'Copy failed'
        : 'Share my wishlist';
  return (
    <div className="border-t border-[var(--color-rule)] px-9 py-6">
      {isShared ? (
        <button
          type="button"
          onClick={onSaveShared}
          className="w-full rounded-md bg-[var(--color-ink)] px-5 py-3 font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--color-paper)] transition-colors hover:bg-[#1a1f1e]"
        >
          Save all to my wishlist
        </button>
      ) : (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onShare}
            className="flex-1 rounded-md border border-[var(--color-rule-strong)] bg-transparent px-5 py-3 font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--color-ink)] transition-colors hover:bg-[rgba(11,15,14,0.04)]"
          >
            {shareLabel}
          </button>
          <button
            type="button"
            onClick={onClear}
            className="border-0 bg-transparent p-0 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-lichen)] transition-colors hover:text-[var(--color-ink)]"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}

function EmptyState({ onBrowse }: { readonly onBrowse: () => void }): ReactElement {
  return (
    <div className="flex h-full flex-col items-start justify-center gap-3 py-12">
      <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-lichen)]">
        Nothing saved yet
      </span>
      <p className="font-display text-[18px] leading-snug text-[var(--color-ink)]">
        Tap the heart on any dossier to save it for later.
      </p>
      <Link
        href="/collections/edition-01"
        onClick={onBrowse}
        className="mt-2 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--color-signal)] hover:text-[var(--color-ink)]"
      >
        Browse Edition 01 →
      </Link>
    </div>
  );
}
