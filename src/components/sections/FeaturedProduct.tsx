/**
 * `<FeaturedProduct />` — single-SKU hero on the homepage.
 *
 * Sits between HomeHero and FeaturedDossiers. Pulls the flagship Field Tote
 * straight from Shopify so the allocation counter stays live. Two-column
 * editorial spread on desktop, stacked on mobile.
 *
 * Maelify §1 composition: fetch lives in the service, render lives here.
 */

import Image from 'next/image';
import Link from 'next/link';

import { fetchManifestProducts } from '@/lib/services/fetch-products';
import { toShopifyHandle } from '@/lib/shopify/handle';

import type { ReactElement } from 'react';

const FEATURED_HANDLE = 'field-tote';

const FEATURED_COPY = {
  eyebrow: 'Featured · The Hub',
  title: 'Field Tote',
  lede: 'Top carry. The piece every other dossier locks into. Anchor-Latch compatible with every component of the system, finished in Porto.',
  callout: '14L · 420D Cordura · YKK AquaGuard',
} as const;

export async function FeaturedProduct(): Promise<ReactElement | null> {
  const result = await fetchManifestProducts();
  if (!result.ok) return null;
  const shopifyHandle = toShopifyHandle(FEATURED_HANDLE);
  const product = result.data.products.find((entry) => entry.handle === shopifyHandle);
  if (!product) return null;

  const remaining = Math.max(0, product.editionTotal - product.editionIssued);
  const issuedLabel = `${String(product.editionIssued).padStart(5, '0')} / ${product.editionTotal} issued · ${remaining} remaining`;

  return (
    <section
      id="featured"
      aria-label="Featured dossier"
      className="border-y border-[var(--color-rule)] bg-[var(--color-paper)] px-5 py-20 md:px-10 md:py-[120px]"
    >
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-12 md:grid-cols-[1.05fr_1fr] md:items-center md:gap-20">
        <Link
          href={`/products/${FEATURED_HANDLE}`}
          className="group relative block aspect-[4/5] overflow-hidden bg-[#eae5dc]"
          data-cursor
          data-track="featured_product_image"
          data-track-label={FEATURED_HANDLE}
        >
          {product.image ? (
            <Image
              src={product.image}
              alt={product.title}
              width={1100}
              height={1375}
              priority
              sizes="(max-width: 768px) 100vw, 55vw"
              className="h-full w-full object-cover transition-transform duration-[1000ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
            />
          ) : null}
          <span className="pointer-events-none absolute left-6 top-6 font-mono text-[11px] uppercase tracking-[0.08em] text-[#5C6B5A]">
            Dossier 01
          </span>
          <span className="pointer-events-none absolute right-6 top-6 font-mono text-[10px] uppercase tracking-[0.06em] text-signal">
            {String(product.editionIssued).padStart(3, '0')} / {product.editionTotal}
          </span>
        </Link>

        <div className="flex flex-col gap-6 md:max-w-[480px]">
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-signal">
            {FEATURED_COPY.eyebrow}
          </span>
          <h2 className="font-display text-[clamp(40px,6vw,72px)] font-bold leading-[0.95] tracking-[-0.02em] text-[var(--color-ink)]">
            {FEATURED_COPY.title}
          </h2>
          <p className="font-body text-[16px] leading-[1.55] text-[var(--color-ink)] md:text-[17px]">
            {FEATURED_COPY.lede}
          </p>
          <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--color-lichen)]">
            {FEATURED_COPY.callout}
          </div>

          <div className="mt-2 flex items-baseline gap-3 border-y border-[var(--color-rule)] py-5">
            <span className="font-display text-[28px] font-bold leading-none text-[var(--color-ink)]">
              €{Math.round(product.price)}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-lichen)]">
              EUR · Incl VAT
            </span>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
            <Link
              href={`/products/${FEATURED_HANDLE}`}
              data-track="featured_product_cta"
              data-track-label={FEATURED_HANDLE}
              className="inline-flex items-center justify-center rounded-md bg-[var(--color-ink)] px-7 py-4 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--color-paper)] transition-colors hover:bg-[#1a1f1e]"
            >
              Reserve from Edition 01
            </Link>
            <Link
              href={`/products/${FEATURED_HANDLE}#gallery`}
              className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--color-lichen)] transition-colors hover:text-[var(--color-ink)]"
            >
              View dossier →
            </Link>
          </div>

          <div
            aria-live="polite"
            className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.04em] text-[var(--color-lichen)]"
          >
            <span
              aria-hidden="true"
              className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#D24A1F]"
            />
            <span>{issuedLabel}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
