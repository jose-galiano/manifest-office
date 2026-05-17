'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useCart, useCartImageForHandle } from '@/hooks/use-cart';
import { ENGRAVING_ALLOWED_REGEX, ENGRAVING_MAX } from '@/lib/constants/commerce';
import { ENGRAVING_UPCHARGE_EUR, hasEngravingOption } from '@/lib/constants/engraving';
import { toShopifyHandle } from '@/lib/shopify/handle';

import type { CartItem } from '@/lib/state/cart';
import type { ChangeEvent, KeyboardEvent, ReactElement } from 'react';

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

function sanitiseEngraving(raw: string): string {
  return raw.toUpperCase().replace(ENGRAVING_ALLOWED_REGEX, '').slice(0, ENGRAVING_MAX);
}

type EngravingSlotProps = {
  readonly item: CartItem;
};

function EngravingSlot({ item }: EngravingSlotProps): ReactElement | null {
  const supportsEngraving = hasEngravingOption(toShopifyHandle(item.handle));
  const { updateEngraving } = useCart();
  const [editing, setEditing] = useState<boolean>(false);
  const [draftText, setDraftText] = useState<string>(item.engraving?.text ?? '');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!editing) setDraftText(item.engraving?.text ?? '');
  }, [editing, item.engraving?.text]);

  useEffect(() => {
    if (!editing) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [editing]);

  // Stable ref so useCallback deps don't churn every render.
  const lineRef = useMemo(
    () => ({
      handle: item.handle,
      issuedAs: item.issuedAs,
      previousText: item.engraving?.text,
    }),
    [item.handle, item.issuedAs, item.engraving?.text],
  );

  const commitEdit = useCallback((): void => {
    const trimmed = draftText.trim();
    updateEngraving(lineRef, trimmed ? { text: trimmed, fee: ENGRAVING_UPCHARGE_EUR } : null);
    setEditing(false);
  }, [draftText, lineRef, updateEngraving]);

  const cancelEdit = useCallback((): void => {
    setDraftText(item.engraving?.text ?? '');
    setEditing(false);
  }, [item.engraving?.text]);

  const removeEngraving = useCallback((): void => {
    updateEngraving(lineRef, null);
    setDraftText('');
    setEditing(false);
  }, [lineRef, updateEngraving]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>): void => {
      if (event.key === 'Enter') {
        event.preventDefault();
        commitEdit();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        cancelEdit();
      }
    },
    [cancelEdit, commitEdit],
  );

  if (!supportsEngraving) return null;

  const hasEngraving = Boolean(item.engraving?.text);
  const draftLength = draftText.length;

  if (editing) {
    // On narrow viewports (cart drawer ≈ 340px) the input + counter + two
    // buttons cannot share a single line — the input would collapse to
    // ~60-80px and become unusable. Below `sm:` we stack into two rows
    // (input on top, counter + actions below). From `sm:` we keep the
    // original inline editor.
    return (
      <div className="py-1">
        <div className="flex flex-col gap-2 font-mono uppercase tracking-[0.06em] sm:flex-row sm:items-center sm:gap-2">
          <div className="flex items-center gap-2 sm:flex-1">
            <span aria-hidden="true" className="text-[10px] text-[var(--color-lichen)]">
              ↳
            </span>
            <input
              ref={inputRef}
              type="text"
              inputMode="text"
              spellCheck={false}
              autoComplete="off"
              maxLength={ENGRAVING_MAX}
              value={draftText}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setDraftText(sanitiseEngraving(event.target.value))
              }
              onKeyDown={handleKeyDown}
              onBlur={commitEdit}
              placeholder="J.MAELIFY"
              aria-label="Engraving text up to 15 characters"
              className="min-w-0 flex-1 border-b border-[var(--color-rule-strong)] bg-transparent py-1.5 text-[16px] tracking-[0.08em] text-[var(--color-ink)] placeholder:text-[var(--color-lichen)] focus:border-[var(--color-signal)] focus:outline-none sm:py-0.5 sm:text-[11px]"
            />
          </div>
          <div className="flex items-center justify-between gap-3 text-[10px] sm:justify-end sm:gap-2">
            <span className="tabular-nums text-[var(--color-lichen)]">
              {String(draftLength).padStart(2, '0')}/{ENGRAVING_MAX}
            </span>
            <div className="flex items-center gap-3 sm:gap-2">
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={commitEdit}
                className="px-2 py-1.5 text-[var(--color-signal)] transition-colors hover:text-[var(--color-ink)] sm:px-1 sm:py-0"
                aria-label="Save engraving"
              >
                Save
              </button>
              {hasEngraving ? (
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={removeEngraving}
                  className="px-2 py-1.5 text-[var(--color-lichen)] transition-colors hover:text-[var(--color-signal)] sm:px-1 sm:py-0"
                  aria-label="Remove engraving"
                >
                  Clear
                </button>
              ) : (
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={cancelEdit}
                  className="px-2 py-1.5 text-[var(--color-lichen)] transition-colors hover:text-[var(--color-ink)] sm:px-1 sm:py-0"
                  aria-label="Cancel engraving edit"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (hasEngraving) {
    return (
      <div className="min-h-[20px]">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-lichen)]">
          <span aria-hidden="true">↳ engraved:</span>
          <span className="tabular-nums text-[var(--color-ink)]">{item.engraving!.text}</span>
          <span>· +€{item.engraving!.fee}</span>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="ml-1 underline underline-offset-4 decoration-[var(--color-rule-strong)] transition-colors hover:text-[var(--color-signal)] hover:decoration-[var(--color-signal)]"
            aria-label={`Edit engraving on ${item.title}`}
          >
            Edit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[20px]">
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-lichen)] transition-colors hover:text-[var(--color-signal)]"
        aria-label={`Add engraving to ${item.title}`}
      >
        + Engrave · +€{ENGRAVING_UPCHARGE_EUR}
      </button>
    </div>
  );
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

  // Image fallback: prefer the URL on the cart item, drop back to the live
  // image-by-handle map if it's stale/empty. Either way the row never goes
  // blank as long as the product is still reachable.
  const liveImage = useCartImageForHandle(item.handle);
  const displayImage = item.imageUrl || liveImage || null;

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
        {displayImage ? (
          <Image
            src={displayImage}
            alt={item.title}
            width={thumbSize * 2}
            height={thumbSize * 2}
            sizes={isPage ? '120px' : '56px'}
            className="h-full w-full object-cover"
            unoptimized={displayImage.startsWith('data:')}
          />
        ) : (
          /* Lichen-on-paper hatched placeholder for the rare case where we
             can't resolve an image (offline, product removed). Keeps the
             row visually anchored without showing a void. */
          <div className="flex h-full w-full items-center justify-center bg-[rgba(11,15,14,0.06)] font-mono text-[9px] uppercase tracking-[0.08em] text-[var(--color-lichen)]">
            {item.title.slice(0, 2)}
          </div>
        )}
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

        <EngravingSlot item={item} />

        {onRemove ? (
          <button
            type="button"
            onClick={() => onRemove(item)}
            className="mt-2 self-start font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-lichen)] transition-colors hover:text-[var(--color-signal)]"
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
