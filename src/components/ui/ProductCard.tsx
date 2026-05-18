'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';

import { useQuickAdd } from '@/hooks/use-quick-add';
import { ENGRAVING_UPCHARGE_EUR, hasEngravingOption } from '@/lib/constants/engraving';
import { toStorefrontHandle } from '@/lib/shopify/handle';

import { QuickAddSheet } from './QuickAddSheet';

import type { ManifestProduct } from '@/lib/types/product';
import type { CSSProperties, MouseEvent, ReactElement } from 'react';

type ProductCardProps = {
  readonly product: ManifestProduct;
  readonly dossierNumber: number;
};

// Brand-bible §07: Edition 01 photography palette — Charcoal is the default
// SKU body, Lichen + Tobacco are the alt colorways. Keep names ↔ hex mapping
// in one place so the swatches on PLP, PDP, and any future filter UI stay in
// lockstep.
const COLORWAY_HEX: Readonly<Record<string, string>> = {
  Charcoal: '#1A1A1A',
  Lichen: '#5C6B5A',
  Tobacco: '#6E5947',
};

type Swatch = {
  readonly name: string;
  readonly hex: string;
  readonly imageUrl: string | null;
};

function formatPrice(amount: number): string {
  return `€${Math.round(amount)}`;
}

function formatAllocation(issued: number, total: number): string {
  const safeTotal = total > 0 ? total : 1200;
  return `${String(issued).padStart(3, '0')} / ${safeTotal}`;
}

// Build the swatches list. For each colorway name advertised on the product,
// find the matching Shopify variant and capture its image. The default
// (first) colorway typically has no variant image because it IS the product
// hero — fall back to the hero in that case.
type QuickAddPillProps = {
  readonly label: string;
  readonly success: boolean;
  readonly disabled: boolean;
  readonly onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  readonly ariaLabel: string;
};

function QuickAddPill({
  label,
  success,
  disabled,
  onClick,
  ariaLabel,
}: QuickAddPillProps): ReactElement {
  const showPlus = !disabled && !success;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || success}
      aria-label={ariaLabel}
      className={`absolute bottom-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-full border border-[rgba(11,15,14,0.12)] bg-[#F2EFE8] px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.08em] text-[#0B0F0E] shadow-[0_2px_10px_rgba(11,15,14,0.12)] transition-[opacity,transform,background] duration-200 hover:bg-white active:scale-[0.97] md:opacity-0 md:translate-y-1 md:group-hover:opacity-100 md:group-hover:translate-y-0 md:group-focus-within:opacity-100 ${
        success ? '!bg-[#2F5D3A] !text-[#F2EFE8] !border-transparent' : ''
      }`}
    >
      {showPlus ? (
        <span aria-hidden="true" className="text-[14px] leading-none">
          +
        </span>
      ) : null}
      <span>{label}</span>
    </button>
  );
}

function resolveQuickAddLabel(isMulti: boolean, pending: boolean, success: boolean): string {
  if (success) return 'Added ✓';
  if (pending) return 'Reserving…';
  return isMulti ? 'Quick add' : 'Add';
}

function buildSwatches(product: ManifestProduct): readonly Swatch[] {
  const heroImage = product.image ?? product.images[0]?.url ?? null;
  return product.colorways.map((name, index) => {
    const variant = product.variants.find((candidate) =>
      candidate.selectedOptions.some(
        (option) => option.name.toLowerCase() === 'colorway' && option.value === name,
      ),
    );
    const variantImage = variant?.image ?? null;
    return {
      name,
      hex: COLORWAY_HEX[name] ?? '#1A1A1A',
      imageUrl: variantImage ?? (index === 0 ? heroImage : heroImage),
    };
  });
}

// PLP card. Brand chrome (paper bg, mono labels, 1px ink-12 rule, hover scale).
// Interactive layer: colorway swatches swap the card hero. The whole card is a
// link to the PDP — swatches stop the click so a colour preview never costs a
// navigation.
export function ProductCard({ product, dossierNumber }: ProductCardProps): ReactElement {
  const storefrontHandle = toStorefrontHandle(product.handle);
  const dossierLabel = `DOSSIER ${String(dossierNumber).padStart(2, '0')}`;
  const allocationLabel = formatAllocation(product.editionIssued, product.editionTotal);
  const presentationLabel = product.volume ? `${product.volume}` : '';
  const showsEngraving = hasEngravingOption(product.handle);

  const swatches = useMemo<readonly Swatch[]>(() => buildSwatches(product), [product]);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [sheetOpen, setSheetOpen] = useState<boolean>(false);

  const closeSheet = useCallback(() => setSheetOpen(false), []);
  const { pending, success, add } = useQuickAdd(
    { storefrontHandle, title: product.title, priceEur: product.price },
    closeSheet,
  );

  const displayedIndex = previewIndex ?? activeIndex;
  const heroFallback = product.image ?? product.images[0]?.url ?? '';
  const displayedImage = swatches[displayedIndex]?.imageUrl ?? heroFallback;
  const activeColorwayName = swatches[activeIndex]?.name ?? '';

  const submitColorway = useCallback(
    (colorwayIndex: number): void => {
      const colorway = swatches[colorwayIndex];
      add({
        colorwayName: colorway?.name ?? '',
        imageUrl: colorway?.imageUrl ?? heroFallback,
      });
    },
    [add, heroFallback, swatches],
  );

  function onQuickAddClick(event: MouseEvent<HTMLButtonElement>): void {
    event.preventDefault();
    event.stopPropagation();
    if (swatches.length > 1) {
      setSheetOpen(true);
      return;
    }
    submitColorway(activeIndex);
  }

  function onSheetClose(): void {
    if (pending) return;
    setSheetOpen(false);
  }

  function onSwatchHover(index: number): void {
    setPreviewIndex(index);
  }

  function onSwatchLeave(): void {
    setPreviewIndex(null);
  }

  function onSwatchClick(event: MouseEvent<HTMLButtonElement>, index: number): void {
    event.preventDefault();
    event.stopPropagation();
    setActiveIndex(index);
    setPreviewIndex(null);
  }

  // Carry the chosen colorway through to the PDP so it lands on the matching
  // variant. We only emit `?color=` when the selection isn't the default
  // (index 0) to keep canonical URLs clean for SEO and AI ingest.
  const pdpHref =
    activeIndex > 0 && activeColorwayName
      ? `/products/${storefrontHandle}?color=${encodeURIComponent(activeColorwayName.toLowerCase())}`
      : `/products/${storefrontHandle}`;

  const isMultiColorway = swatches.length > 1;
  const showInlinePending = !isMultiColorway && pending;
  const showInlineSuccess = !isMultiColorway && success;
  const quickAddLabel = resolveQuickAddLabel(isMultiColorway, showInlinePending, showInlineSuccess);

  return (
    <div className="relative">
      <Link
        href={pdpHref}
        className="group relative block bg-[#F2EFE8] transition-colors duration-300 hover:bg-[rgba(11,15,14,0.03)]"
        data-cursor
        aria-label={activeColorwayName ? `${product.title} — ${activeColorwayName}` : product.title}
      >
        <span className="pointer-events-none absolute left-6 top-6 z-10 font-mono text-[11px] uppercase tracking-[0.06em] text-[#5C6B5A]">
          {dossierLabel}
        </span>
        <span className="pointer-events-none absolute right-6 top-6 z-10 font-mono text-[10px] uppercase tracking-[0.06em] text-signal">
          {allocationLabel}
        </span>

        <div className="relative aspect-[4/5] overflow-hidden bg-[#eae5dc]">
          {displayedImage ? (
            <Image
              src={displayedImage}
              alt={activeColorwayName ? `${product.title} — ${activeColorwayName}` : product.title}
              width={800}
              height={1000}
              sizes="(max-width: 820px) 100vw, (max-width: 1280px) 50vw, 33vw"
              className="h-full w-full object-cover transition-transform duration-[1000ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
            />
          ) : null}
          <QuickAddPill
            label={quickAddLabel}
            success={showInlineSuccess}
            disabled={showInlinePending}
            onClick={onQuickAddClick}
            ariaLabel={`${quickAddLabel} — ${product.title}`}
          />
        </div>

        <div className="flex items-start justify-between gap-4 border-t border-[rgba(11,15,14,0.12)] px-7 py-6">
          <div className="flex flex-col gap-1.5">
            {presentationLabel ? (
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#5C6B5A]">
                {presentationLabel}
              </span>
            ) : null}
            <h3 className="font-display text-[26px] font-bold leading-none tracking-tight text-[#0B0F0E]">
              {product.title}
            </h3>

            {swatches.length > 0 ? (
              <div
                className="mt-3 flex items-center gap-2"
                role="group"
                aria-label={`Colorways for ${product.title}`}
                onMouseLeave={onSwatchLeave}
              >
                {swatches.map((swatch, index) => {
                  const isActive = index === activeIndex;
                  const isPreviewed = index === previewIndex;
                  // Button hit-box is 24×24 (WCAG 2.5.8); the visible chip is a
                  // 16×16 inner span so the brand chip size stays unchanged.
                  const innerStateClass = isActive
                    ? 'border-[rgba(11,15,14,0.55)] outline outline-2 outline-offset-2 outline-[#0B0F0E]'
                    : isPreviewed
                      ? 'border-[rgba(11,15,14,0.55)] outline outline-1 outline-offset-2 outline-[rgba(11,15,14,0.55)]'
                      : 'border-[rgba(11,15,14,0.35)]';
                  const chipStyle: CSSProperties = { background: swatch.hex };
                  return (
                    <button
                      type="button"
                      key={swatch.name}
                      onClick={(event) => onSwatchClick(event, index)}
                      onMouseEnter={() => onSwatchHover(index)}
                      onFocus={() => onSwatchHover(index)}
                      onBlur={onSwatchLeave}
                      aria-label={`Preview ${swatch.name} colorway`}
                      aria-pressed={isActive}
                      className="grid h-6 w-6 cursor-pointer place-items-center bg-transparent p-0"
                    >
                      <span
                        aria-hidden="true"
                        className={`block h-4 w-4 rounded-full border transition-[outline,transform] duration-200 ${innerStateClass}`}
                        style={chipStyle}
                      />
                    </button>
                  );
                })}
                <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.08em] text-[#5C6B5A]">
                  {(swatches[displayedIndex]?.name ?? '').toUpperCase()}
                </span>
              </div>
            ) : null}
          </div>
          <div className="text-right">
            <div className="font-mono text-[14px] font-medium text-[#0B0F0E]">
              {formatPrice(product.price)}
            </div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.06em] text-[#5C6B5A]">
              EUR · INCL VAT
            </div>
            {showsEngraving ? (
              <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.08em] text-[#5C6B5A]">
                +€{ENGRAVING_UPCHARGE_EUR} ENGRAVING
              </div>
            ) : null}
          </div>
        </div>
      </Link>
      {isMultiColorway ? (
        <QuickAddSheet
          open={sheetOpen}
          title={product.title}
          priceEur={product.price}
          swatches={swatches}
          initialIndex={displayedIndex}
          pending={pending}
          success={success}
          onClose={onSheetClose}
          onSubmit={submitColorway}
        />
      ) : null}
    </div>
  );
}
