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

import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';

import { reserveProductAction } from '@/app/[locale]/products/[handle]/actions';
import { useCart } from '@/hooks/use-cart';
import { useRouter } from '@/i18n/navigation';
import { type Locale } from '@/i18n/routing';
import { CUSTOM_EVENTS, ECOMMERCE_EVENTS, track } from '@/lib/analytics';
import { ENGRAVING_ALLOWED_REGEX, ENGRAVING_FEE, ENGRAVING_MAX } from '@/lib/constants/commerce';
import { hasEngravingOption } from '@/lib/constants/engraving';
import {
  convertFromEur,
  formatCurrencyCaption,
  formatPriceForLocale,
  resolveCurrency,
} from '@/lib/i18n/currency';

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
  /**
   * Name of the colorway to select on mount. Sourced from `?color=` on the
   * URL (set by the PLP card when the customer picked a non-default swatch).
   * Falls back to the first colorway when absent or unrecognised.
   */
  readonly initialColorwayName?: string;
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

// SIZE selector. Each size is a real Shopify product with its own canonical
// URL (cube-s, cube-m, cube-l) — so we *do* navigate on selection. The trick
// is to keep the page mounted by using `router.replace({ scroll: false })`
// inside a `useTransition`. React 19 streams the new RSC payload into the
// same tree; the only visible change is the price + gallery + variant copy.
// No scroll jump, no full-tree unmount, no flash.
function SizeSelector({ options, currentHandle }: SizeSelectorProps): ReactElement | null {
  const t = useTranslations('pdp');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (options.length === 0) return null;

  return (
    <div
      className={`mt-8 transition-opacity duration-200 ${isPending ? 'opacity-70' : 'opacity-100'}`}
      aria-busy={isPending}
    >
      <span className="mb-2 block font-mono text-[11px] uppercase tracking-[0.06em] text-[#5C6B5A]">
        {t('size_label').toUpperCase()}
      </span>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isActive = option.storefrontHandle === currentHandle;
          return (
            <button
              key={option.storefrontHandle}
              type="button"
              data-cursor
              aria-current={isActive ? 'page' : undefined}
              disabled={isActive || isPending}
              onClick={(): void => {
                if (isActive) return;
                startTransition(() => {
                  router.replace(`/products/${option.storefrontHandle}`, { scroll: false });
                });
              }}
              className={optionClass(isActive)}
            >
              {option.label}
            </button>
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
  const t = useTranslations('pdp');
  if (colorways.length === 0) return null;
  const activeName = (active?.name ?? colorways[0]?.name ?? '').toUpperCase();
  return (
    <div className="mt-7">
      <span className="mb-2 block font-mono text-[11px] uppercase tracking-[0.06em] text-[#5C6B5A]">
        {t('colorway_active', { name: activeName })}
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
  const t = useTranslations('pdp');
  const locale = useLocale() as Locale;
  const currency = resolveCurrency(locale);
  const feeAmount = Math.round(convertFromEur(ENGRAVING_FEE, currency));
  const feeLabel = new Intl.NumberFormat(locale === 'zh' ? 'zh-CN' : locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(feeAmount);
  return (
    <div className="mt-7">
      <span className="mb-2 block font-mono text-[11px] uppercase tracking-[0.06em] text-[#5C6B5A]">
        {t('engraving_optional', { fee: `+${feeLabel}` })}
      </span>
      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={(): void => onToggle(false)}
          data-cursor
          className={optionClass(!on)}
        >
          {t('engraving_none').toUpperCase()}
        </button>
        <button
          type="button"
          onClick={(): void => onToggle(true)}
          data-cursor
          className={optionClass(on)}
        >
          {t('engraving_add').toUpperCase()}
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
  initialColorwayName,
  issued,
  total,
  onColorwayChange,
}: PdpBuyboxProps): ReactElement {
  const t = useTranslations('pdp');
  const locale = useLocale() as Locale;
  const { add: addCartItem, openDrawer } = useCart();
  const [isPending, startTransition] = useTransition();

  const supportsEngraving = hasEngravingOption(shopifyHandle);
  const [engravingOn, setEngravingOn] = useState<boolean>(false);
  const [engravingText, setEngravingText] = useState<string>('');

  // Resolve the colorway to land on. The server already normalised the
  // `?color=` query param, but we re-match here so client-side reloads (and
  // direct deep-links from email / shared URLs) stay coherent.
  const initialColorway =
    (initialColorwayName
      ? colorways.find((swatch) => swatch.name.toLowerCase() === initialColorwayName.toLowerCase())
      : undefined) ?? colorways[0];
  const [activeColorway, setActiveColorway] = useState<ColorwaySwatch | undefined>(initialColorway);
  const [toast, setToast] = useState<ReserveToast | null>(null);

  // Auto-dismiss the toast after 6 seconds (legacy behaviour — long enough
  // to read the mono confirmation, short enough not to block the UI).
  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 6000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    track(ECOMMERCE_EVENTS.viewItem, {
      ecommerce: {
        currency: 'EUR',
        value: priceEur,
        items: [
          {
            item_id: storefrontHandle,
            item_name: title,
            item_brand: 'Manifest Office',
            price: priceEur,
            quantity: 1,
            currency: 'EUR',
          },
        ],
      },
    });
  }, [storefrontHandle, priceEur, title]);

  const handleEngravingInput = useCallback((rawValue: string): void => {
    setEngravingText(sanitiseEngraving(rawValue));
  }, []);

  const handleColorwayClick = useCallback(
    (colorway: ColorwaySwatch): void => {
      setActiveColorway(colorway);
      track(CUSTOM_EVENTS.variantView, {
        params: {
          handle: storefrontHandle,
          variant_type: 'colorway',
          variant_name: colorway.name,
        },
      });
      onColorwayChange?.(colorway);
      // Sync the URL so it stays shareable. Use `history.replaceState` rather
      // than `router.replace` — the colorway swap is pure client state (no
      // server fetch needed), so we want the URL bar to update without
      // triggering Next.js's force-dynamic re-render. Default colorway (the
      // first one) → omit the query so the canonical URL stays clean for SEO.
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        const isDefault = colorway.name === colorways[0]?.name;
        if (isDefault) {
          url.searchParams.delete('color');
        } else {
          url.searchParams.set('color', colorway.name.toLowerCase());
        }
        const nextPath = url.searchParams.toString()
          ? `${url.pathname}?${url.searchParams.toString()}`
          : url.pathname;
        window.history.replaceState(window.history.state, '', nextPath);
      }
    },
    [colorways, onColorwayChange, storefrontHandle],
  );

  const remaining = useMemo<number>(() => Math.max(0, total - issued), [issued, total]);
  const allocationLabel = `${padIssue(issued)} / ${total} issued · ${remaining} remaining`;

  const submittedEngraving = engravingOn && engravingText.length > 0 ? engravingText : null;

  const handleReserve = useCallback((): void => {
    track(CUSTOM_EVENTS.reserveClick, {
      params: {
        handle: storefrontHandle,
        title,
        price: priceEur,
        colorway: activeColorway?.name,
        has_engraving: Boolean(submittedEngraving),
      },
    });
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
      const totalValue = priceEur + (reservation.engraving ? reservation.engraving_fee : 0);
      track(ECOMMERCE_EVENTS.addToCart, {
        ecommerce: {
          currency: 'EUR',
          value: totalValue,
          items: [
            {
              item_id: storefrontHandle,
              item_name: title,
              item_brand: 'Manifest Office',
              item_variant: activeColorway?.name,
              price: priceEur,
              quantity: 1,
              currency: 'EUR',
            },
          ],
        },
        params: { issue: reservation.issue },
        fanout: { klaviyo: true },
      });
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
        {t('buy_eyebrow', {
          edition: editionNumber,
          dossier: String(dossierNumber).padStart(2, '0'),
        }).toUpperCase()}
      </span>

      <div className="mt-5 font-display text-[38px] font-bold leading-none tracking-[-0.02em] text-[#0B0F0E]">
        {formatPriceForLocale(priceEur, locale)}
      </div>
      {supportsEngraving && engravingOn ? (
        <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-signal">
          {`+ ${new Intl.NumberFormat(locale === 'zh' ? 'zh-CN' : locale, {
            style: 'currency',
            currency: resolveCurrency(locale),
            maximumFractionDigits: 0,
            minimumFractionDigits: 0,
          }).format(
            Math.round(convertFromEur(ENGRAVING_FEE, resolveCurrency(locale))),
          )} ${(t('engraving_optional', { fee: '' }).split('(')[0] ?? '').trim().toUpperCase()}`}
        </div>
      ) : null}
      <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.04em] text-[#5C6B5A]">
        {formatCurrencyCaption(locale).toUpperCase()}
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
          {isPending ? t('reserve_pending') : t('reserve_idle')}
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
        id="allocation"
        aria-live="polite"
        className="mo-allocation mt-2 flex scroll-mt-[110px] items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[11px] uppercase tracking-[0.04em] text-[#5C6B5A] -mx-2"
      >
        <span
          aria-hidden="true"
          className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#D24A1F]"
        />
        <span>{allocationLabel}</span>
        <style>{`
          .mo-allocation { position: relative; }
          .mo-allocation:target {
            animation: mo-allocation-echo 1600ms cubic-bezier(0.22, 1, 0.36, 1);
          }
          .mo-allocation:target::before {
            content: '';
            position: absolute;
            inset: -4px;
            border-radius: 8px;
            border: 1.5px solid rgba(210, 74, 31, 0.7);
            pointer-events: none;
            animation: mo-allocation-ring 1600ms cubic-bezier(0.22, 1, 0.36, 1);
          }
          @keyframes mo-allocation-echo {
            0%   { background-color: rgba(210, 74, 31, 0.18); }
            70%  { background-color: rgba(210, 74, 31, 0.08); }
            100% { background-color: transparent; }
          }
          @keyframes mo-allocation-ring {
            0%   { transform: scale(1); opacity: 0; }
            10%  { opacity: 1; }
            100% { transform: scale(1.25); opacity: 0; }
          }
          @media (prefers-reduced-motion: reduce) {
            .mo-allocation:target { animation: none; }
            .mo-allocation:target::before { animation: none; opacity: 0; }
          }
        `}</style>
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
