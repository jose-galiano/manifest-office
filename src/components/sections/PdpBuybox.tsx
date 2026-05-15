/**
 * `<PdpBuybox />` — variant + engraving + reserve control surface.
 *
 * Client component. Owns:
 *  - Engraving toggle (NONE / ADD ENGRAVING), live char counter, sanitiser.
 *  - Size selector (Link nav to sibling SKU when product has S/M/L variants).
 *  - Colorway swatches — local state, parent is told via `onColorwayChange`
 *    so the hero image can swap.
 *  - Reserve action: invokes the server action, pushes the issued item
 *    into the Zustand cart, displays a mono confirmation toast.
 *
 * Ports `deploy/pdp.html` lines ~774-823 + the engraving / reserve closure
 * starting at line 1449. Behaviour matches legacy with two refinements:
 *  - Sanitiser regex + max length are imported from
 *    `lib/constants/commerce` (single source of truth, was inline before).
 *  - The server re-derives the engraving fee from a trusted constant
 *    (anti-tamper, see `lib/services/reserve-product.ts`).
 */

'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';

import { reserveProductAction } from '@/app/products/[handle]/actions';
import { useCart } from '@/hooks/use-cart';
import { ENGRAVING_ALLOWED_REGEX, ENGRAVING_FEE, ENGRAVING_MAX } from '@/lib/constants/commerce';
import { hasEngravingOption } from '@/lib/constants/engraving';

import type { ReactElement } from 'react';

/** Storefront-handle sibling reference for the SIZE selector. */
export type SizeOption = {
  readonly storefrontHandle: string;
  /** Short label, e.g. `S · 0.8L`. */
  readonly label: string;
};

export type ColorwaySwatch = {
  /** Display name, e.g. `Charcoal`. */
  readonly name: string;
  /** CSS colour, e.g. `#1A1A1A`. */
  readonly hex: string;
  /** Variant image URL for this colorway, when known. */
  readonly imageUrl: string | null;
};

export type PdpBuyboxProps = {
  readonly storefrontHandle: string;
  /** Shopify handle — used to check engraving eligibility (hardware excluded). */
  readonly shopifyHandle: string;
  readonly title: string;
  /** Price in EUR. */
  readonly priceEur: number;
  readonly summary: string;
  readonly editionNumber: string;
  readonly dossierNumber: number;
  readonly imageUrl: string;
  /** Pre-sorted sibling size options. Empty array hides the SIZE block. */
  readonly sizeOptions: readonly SizeOption[];
  readonly colorways: readonly ColorwaySwatch[];
  /** Live allocation. Re-renders per request (`force-dynamic` page). */
  readonly issued: number;
  readonly total: number;
  /** Fired when a colorway is clicked. Parent owns the gallery hero swap. */
  readonly onColorwayChange?: (colorway: ColorwaySwatch) => void;
};

type ReserveToast = {
  readonly issueLabel: string;
  readonly title: string;
  readonly colorway: string;
  readonly engraving: string | null;
};

type ReserveSuccessPayload = {
  readonly issued_label: string;
  readonly issue: number;
  readonly engraving: string | null;
  readonly engraving_fee: number;
};

function padIssue(value: number, width = 5): string {
  return String(value).padStart(width, '0');
}

function sanitiseEngraving(raw: string): string {
  return raw.toUpperCase().replace(ENGRAVING_ALLOWED_REGEX, '').slice(0, ENGRAVING_MAX);
}

function formatPrice(amount: number): string {
  return `€${Math.round(amount)}`;
}

function buildSoldOutToast(title: string, colorway: string | undefined): ReserveToast {
  return {
    issueLabel: 'SOLD OUT',
    title,
    colorway: colorway?.toUpperCase() ?? '—',
    engraving: null,
  };
}

function buildSuccessToast(
  reservation: ReserveSuccessPayload,
  title: string,
  colorway: string | undefined,
): ReserveToast {
  return {
    issueLabel: `OPERATOR ${reservation.issued_label}`,
    title,
    colorway: colorway?.toUpperCase() ?? '—',
    engraving: reservation.engraving,
  };
}

const OPTION_BUTTON_BASE =
  'border px-4 py-2.5 font-mono text-[12px] uppercase tracking-[0.04em] transition-colors';
const OPTION_BUTTON_ACTIVE = 'border-[#0B0F0E] bg-[#0B0F0E] text-[#F2EFE8]';
const OPTION_BUTTON_IDLE =
  'border-[rgba(11,15,14,0.4)] bg-[#F2EFE8] text-[#0B0F0E] hover:border-[#0B0F0E]';

function optionClass(isActive: boolean): string {
  return `${OPTION_BUTTON_BASE} ${isActive ? OPTION_BUTTON_ACTIVE : OPTION_BUTTON_IDLE}`;
}

type SizeSelectorProps = {
  readonly options: readonly SizeOption[];
  readonly currentHandle: string;
};

function SizeSelector({ options, currentHandle }: SizeSelectorProps): ReactElement | null {
  if (options.length === 0) return null;
  return (
    <div className="mt-8">
      <span className="mb-2 block font-mono text-[11px] uppercase tracking-[0.06em] text-[#5C6B5A]">
        SIZE
      </span>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isActive = option.storefrontHandle === currentHandle;
          return (
            <Link
              key={option.storefrontHandle}
              href={`/products/${option.storefrontHandle}`}
              data-cursor
              aria-current={isActive ? 'page' : undefined}
              className={optionClass(isActive)}
            >
              {option.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

type ColorwayPickerProps = {
  readonly colorways: readonly ColorwaySwatch[];
  readonly active: ColorwaySwatch | undefined;
  readonly onSelect: (colorway: ColorwaySwatch) => void;
};

function ColorwayPicker({ colorways, active, onSelect }: ColorwayPickerProps): ReactElement | null {
  if (colorways.length === 0) return null;
  const activeName = (active?.name ?? colorways[0]?.name ?? '').toUpperCase();
  return (
    <div className="mt-7">
      <span className="mb-2 block font-mono text-[11px] uppercase tracking-[0.06em] text-[#5C6B5A]">
        COLORWAY · {activeName}
      </span>
      <div className="flex gap-2.5">
        {colorways.map((colorway) => {
          const isActive = colorway.name === active?.name;
          return (
            <button
              type="button"
              key={colorway.name}
              onClick={(): void => onSelect(colorway)}
              title={colorway.name}
              aria-label={`Colorway: ${colorway.name}`}
              aria-pressed={isActive}
              className={`h-7 w-7 cursor-pointer rounded-full border border-[rgba(11,15,14,0.4)] transition-[outline] ${
                isActive ? 'outline outline-2 outline-offset-2 outline-[#0B0F0E]' : ''
              }`}
              style={{ background: colorway.hex }}
            />
          );
        })}
      </div>
    </div>
  );
}

type EngravingFieldProps = {
  readonly on: boolean;
  readonly text: string;
  readonly onToggle: (on: boolean) => void;
  readonly onTextChange: (next: string) => void;
};

function EngravingField({ on, text, onToggle, onTextChange }: EngravingFieldProps): ReactElement {
  return (
    <div className="mt-7">
      <span className="mb-2 block font-mono text-[11px] uppercase tracking-[0.06em] text-[#5C6B5A]">
        ENGRAVING (OPTIONAL · +€{ENGRAVING_FEE})
      </span>
      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={(): void => onToggle(false)}
          data-cursor
          className={optionClass(!on)}
        >
          NONE
        </button>
        <button
          type="button"
          onClick={(): void => onToggle(true)}
          data-cursor
          className={optionClass(on)}
        >
          ADD ENGRAVING
        </button>
      </div>
      {on ? (
        <div>
          <div className="flex items-stretch border border-[rgba(11,15,14,0.4)] bg-[rgba(255,255,255,0.6)]">
            <input
              type="text"
              value={text}
              maxLength={ENGRAVING_MAX}
              autoComplete="off"
              spellCheck={false}
              placeholder="J.MAELIFY"
              aria-label="Engraving text up to 15 characters"
              onChange={(event): void => onTextChange(event.target.value)}
              className="flex-1 border-0 bg-transparent px-3 py-[11px] font-mono text-[14px] uppercase tracking-[0.08em] text-[#0B0F0E] outline-none"
            />
            <span className="flex items-center border-l border-[rgba(11,15,14,0.4)] px-3 font-mono text-[10px] tracking-[0.06em] text-[#5C6B5A]">
              {padIssue(text.length, 2)} / {ENGRAVING_MAX}
            </span>
          </div>
          <div className="mt-2 font-mono text-[10px] uppercase leading-[1.5] tracking-[0.08em] text-[#5C6B5A]">
            ↳ Laser-etched on the inside brass plate · permanent · finished in Porto
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function PdpBuybox({
  storefrontHandle,
  shopifyHandle,
  title,
  priceEur,
  summary,
  editionNumber,
  dossierNumber,
  imageUrl,
  sizeOptions,
  colorways,
  issued,
  total,
  onColorwayChange,
}: PdpBuyboxProps): ReactElement {
  const { add: addCartItem, openDrawer } = useCart();
  const [isPending, startTransition] = useTransition();

  const supportsEngraving = hasEngravingOption(shopifyHandle);
  const [engravingOn, setEngravingOn] = useState<boolean>(false);
  const [engravingText, setEngravingText] = useState<string>('');

  const initialColorway = colorways[0];
  const [activeColorway, setActiveColorway] = useState<ColorwaySwatch | undefined>(initialColorway);
  const [toast, setToast] = useState<ReserveToast | null>(null);

  // Auto-dismiss the toast after 6 seconds (legacy behaviour — long enough
  // to read the mono confirmation, short enough not to block the UI).
  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 6000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleEngravingInput = useCallback((rawValue: string): void => {
    setEngravingText(sanitiseEngraving(rawValue));
  }, []);

  const handleColorwayClick = useCallback(
    (colorway: ColorwaySwatch): void => {
      setActiveColorway(colorway);
      onColorwayChange?.(colorway);
    },
    [onColorwayChange],
  );

  const remaining = useMemo<number>(() => Math.max(0, total - issued), [issued, total]);
  const allocationLabel = `${padIssue(issued)} / ${total} issued · ${remaining} remaining`;

  const submittedEngraving = engravingOn && engravingText.length > 0 ? engravingText : null;

  const handleReserve = useCallback((): void => {
    startTransition(async () => {
      const result = await reserveProductAction(storefrontHandle, submittedEngraving);
      if (!result.ok) return;
      if ('sold_out' in result.data) {
        setToast(buildSoldOutToast(title, activeColorway?.name));
        return;
      }
      const reservation = result.data;
      addCartItem({
        handle: storefrontHandle,
        title,
        price: priceEur,
        imageUrl,
        issuedAs: reservation.issue,
        engraving: reservation.engraving
          ? { text: reservation.engraving, fee: reservation.engraving_fee }
          : undefined,
      });
      // Show the operator the reservation in the global cart drawer per the
      // Wave-3B coordination note in the cart store JSDoc.
      openDrawer();
      setToast(buildSuccessToast(reservation, title, activeColorway?.name));
    });
  }, [
    activeColorway,
    addCartItem,
    imageUrl,
    openDrawer,
    priceEur,
    storefrontHandle,
    submittedEngraving,
    title,
  ]);

  return (
    <aside className="self-start pt-2 lg:sticky lg:top-[130px]">
      <span className="block font-mono text-[11px] uppercase tracking-[0.06em] text-[#5C6B5A]">
        EDITION {editionNumber} / DOSSIER {String(dossierNumber).padStart(2, '0')}
      </span>

      <div className="mt-5 font-display text-[38px] font-bold leading-none tracking-[-0.02em] text-[#0B0F0E]">
        {formatPrice(priceEur)}
      </div>
      {supportsEngraving && engravingOn ? (
        <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-[#D24A1F]">
          + €{ENGRAVING_FEE} ENGRAVING
        </div>
      ) : null}
      <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.04em] text-[#5C6B5A]">
        EUR · INCL. VAT
      </div>

      <p className="mt-6 max-w-[42ch] text-[16px] leading-[1.55] text-[#0B0F0E]">{summary}</p>

      <SizeSelector options={sizeOptions} currentHandle={storefrontHandle} />
      <ColorwayPicker
        colorways={colorways}
        active={activeColorway}
        onSelect={handleColorwayClick}
      />
      {supportsEngraving ? (
        <EngravingField
          on={engravingOn}
          text={engravingText}
          onToggle={(next): void => {
            setEngravingOn(next);
            if (!next) setEngravingText('');
          }}
          onTextChange={handleEngravingInput}
        />
      ) : null}

      <div className="mt-8 flex gap-2">
        <button
          type="button"
          onClick={handleReserve}
          disabled={isPending}
          data-cursor
          className="flex-1 cursor-pointer border-0 bg-[#0B0F0E] px-6 py-[18px] font-mono text-[12px] uppercase tracking-[0.1em] font-medium text-[#F2EFE8] transition-[background,letter-spacing] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#D24A1F] hover:tracking-[0.14em] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? 'Reserving…' : 'Reserve from Edition 01'}
        </button>
        <button
          type="button"
          data-cursor
          aria-label="Share dossier"
          className="cursor-pointer border border-[rgba(11,15,14,0.4)] bg-transparent px-[18px] py-[18px] font-mono text-[12px] uppercase tracking-[0.06em] text-[#0B0F0E] transition-colors hover:bg-[#0B0F0E] hover:text-[#F2EFE8]"
        >
          ↗
        </button>
      </div>

      <div
        aria-live="polite"
        className="mt-2 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.04em] text-[#5C6B5A]"
      >
        <span
          aria-hidden="true"
          className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#D24A1F]"
        />
        <span>{allocationLabel}</span>
      </div>

      {toast ? (
        <div
          role="status"
          className="mt-6 border border-[#D24A1F] bg-[rgba(210,74,31,0.08)] p-5 font-mono text-[12px] uppercase leading-[1.6] tracking-[0.06em] text-[#0B0F0E]"
        >
          {toast.issueLabel} · {toast.title}
          {toast.colorway ? ` · ${toast.colorway}` : ''}
          {toast.engraving ? ` · ENGRAVING ${toast.engraving}` : ''}
        </div>
      ) : null}
    </aside>
  );
}
