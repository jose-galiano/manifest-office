/**
 * Shared cart row primitive.
 *
 * Used by both `CartDrawer` (compact 56px thumb) and `/cart` (large 120px
 * thumb). Receives a typed `CartItem` plus presentation knobs. Contains no
 * fetching, no business logic — purely a render of one row.
 *
 * Legacy reference: `deploy/pdp.html` lines 1230–1248 (drawer item markup)
 * and the engraving sub-line at line 1237.
 */

'use client';

import Image from 'next/image';

import type { CartItem } from '@/lib/state/cart';
import type { ReactElement } from 'react';

export type CartItemRowVariant = 'drawer' | 'page';

export type CartItemRowProps = {
  readonly item: CartItem;
  readonly variant?: CartItemRowVariant;
  /** When provided, render a small "Remove" affordance that calls back. */
  readonly onRemove?: (item: CartItem) => void;
};

function formatPrice(amount: number): string {
  return `€${Math.round(amount)}`;
}

function formatDossier(issuedAs: number | undefined): string | null {
  if (typeof issuedAs !== 'number' || !Number.isFinite(issuedAs)) return null;
  return `DOSSIER ${String(issuedAs).padStart(3, '0')} / 1200`;
}

export function CartItemRow({
  item,
  variant = 'drawer',
  onRemove,
}: CartItemRowProps): ReactElement {
  const isPage = variant === 'page';
  const thumbSize = isPage ? 120 : 56;
  const dossierLabel = formatDossier(item.issuedAs);
  const totalPrice = item.price + (item.engraving?.fee ?? 0);

  return (
    <div
      className={[
        'grid items-center gap-[18px]',
        isPage
          ? 'grid-cols-[120px_1fr_auto] py-7 border-b border-[var(--color-rule)]'
          : 'grid-cols-[56px_1fr_auto] py-4',
      ].join(' ')}
    >
      <div
        className="overflow-hidden bg-[rgba(11,15,14,0.06)]"
        style={{ width: thumbSize, height: thumbSize }}
      >
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.title}
            width={thumbSize * 2}
            height={thumbSize * 2}
            sizes={isPage ? '120px' : '56px'}
            className="h-full w-full object-cover"
          />
        ) : null}
      </div>

      <div className="flex min-w-0 flex-col gap-1">
        {dossierLabel ? (
          <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-lichen)]">
            {dossierLabel}
          </span>
        ) : null}
        <span
          className={[
            'font-display font-medium leading-[1.2] tracking-[-0.005em] text-[var(--color-ink)]',
            isPage ? 'text-[22px]' : 'text-[15px]',
          ].join(' ')}
        >
          {item.title}
        </span>
        {item.engraving?.text ? (
          <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-lichen)]">
            ↳ engraved: <span className="text-[var(--color-ink)]">{item.engraving.text}</span> · +€
            {item.engraving.fee}
          </span>
        ) : null}
        {onRemove ? (
          <button
            type="button"
            onClick={() => onRemove(item)}
            className="mt-2 self-start font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-lichen)] hover:text-[var(--color-signal)] transition-colors"
            aria-label={`Remove ${item.title} from manifest`}
          >
            Remove
          </button>
        ) : null}
      </div>

      <div className="flex flex-col items-end gap-1">
        <span
          className={[
            'font-mono text-[var(--color-ink)]',
            isPage ? 'text-[15px]' : 'text-[13px]',
          ].join(' ')}
        >
          {formatPrice(totalPrice)}
        </span>
        {isPage ? (
          <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-lichen)]">
            EUR · INCL VAT
          </span>
        ) : null}
      </div>
    </div>
  );
}
