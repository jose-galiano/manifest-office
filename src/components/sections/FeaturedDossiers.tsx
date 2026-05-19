/**
 * `<FeaturedDossiers />` — homepage product showcase.
 *
 * Server-rendered. The single biggest conversion gap on the previous
 * homepage was the lack of any visible SKU above the fold of the second
 * scroll. This section pulls four anchor dossiers (Field Tote, Tech Pouch M,
 * Cube M, Anchor Latch) straight from Shopify Admin via the existing
 * `fetchManifestProducts()` service, so allocation counters stay live.
 *
 * Maelify §1: this is composition only. Fetch lives in the service; cards
 * live in the `<ProductCard>` UI primitive; we just orchestrate.
 */

import { ProductCard } from '@/components/ui/ProductCard';
import { EDITION_01_PRODUCTS, type Product, findProductByHandle } from '@/content/manifest-office';
import { Link } from '@/i18n/navigation';
import { fetchManifestProducts } from '@/lib/services/fetch-products';
import { toShopifyHandle } from '@/lib/shopify/handle';

import type { ManifestProduct } from '@/lib/types/product';
import type { ReactElement } from 'react';

// Four anchor storefront handles — picked for breadth (one of each kit role).
// Order matters: it determines the dossier ordinal shown on the card.
const FEATURED_HANDLES: readonly string[] = [
  'field-tote',
  'tech-pouch-m',
  'cube-m',
  'anchor-latch',
];

interface FeaturedRow {
  readonly catalog: Product;
  readonly live: ManifestProduct;
}

function buildRows(liveProducts: readonly ManifestProduct[]): readonly FeaturedRow[] {
  const rows: FeaturedRow[] = [];
  for (const storefrontHandle of FEATURED_HANDLES) {
    const catalog = findProductByHandle(storefrontHandle);
    if (!catalog) continue;
    const live = liveProducts.find(
      (candidate) => candidate.handle === toShopifyHandle(storefrontHandle),
    );
    if (!live) continue;
    rows.push({ catalog, live });
  }
  return rows;
}

export async function FeaturedDossiers(): Promise<ReactElement | null> {
  const fetchResult = await fetchManifestProducts();
  const liveProducts: readonly ManifestProduct[] = fetchResult.ok ? fetchResult.data.products : [];
  const rows = buildRows(liveProducts);
  if (rows.length === 0) return null;

  return (
    <section
      aria-label="Featured dossiers"
      className="bg-[#F2EFE8] px-5 md:px-10 py-16 md:py-[120px] text-[#0B0F0E]"
    >
      <div className="mx-auto max-w-[1800px]">
        <header className="mb-14 grid grid-cols-1 items-end gap-8 md:grid-cols-[2fr_1fr] md:gap-20">
          <div>
            <span className="mb-5 block font-mono text-[11px] tracking-[0.12em] uppercase text-signal">
              — EDITION 01 · FEATURED DOSSIERS —
            </span>
            <h2 className="font-display font-bold leading-[0.95] tracking-[-0.02em] text-[clamp(40px,5.5vw,80px)]">
              Four pieces that
              <br />
              hold the system together.
            </h2>
          </div>
          <div className="flex items-end justify-start md:justify-end">
            <Link
              href="/collections/edition-01"
              data-cursor
              className="group inline-flex items-center gap-2 border-b border-[#0B0F0E] pb-1 font-mono text-[12px] uppercase tracking-[0.12em] text-[#0B0F0E] transition-colors duration-200 hover:text-signal hover:border-[#D24A1F]"
            >
              <span>View all 10 dossiers</span>
              <span
                aria-hidden="true"
                className="transition-transform duration-200 group-hover:translate-x-1"
              >
                →
              </span>
            </Link>
          </div>
        </header>

        {/* Mobile: swipe carousel — one card visible at a time, snap-x. Hides
            the native scrollbar, no JS dependency. Desktop (>= sm) keeps the
            grid because users expect to compare products side-by-side on
            wider screens. */}
        <div className="sm:hidden -mx-5">
          <div className="flex gap-4 overflow-x-auto overflow-y-hidden snap-x snap-mandatory no-scrollbar px-5 pb-4">
            {rows.map((row) => (
              <div key={row.catalog.handle} className="w-[78vw] shrink-0 snap-start">
                <ProductCard
                  product={row.live}
                  dossierNumber={
                    EDITION_01_PRODUCTS.findIndex((entry) => entry.handle === row.catalog.handle) +
                    1
                  }
                />
              </div>
            ))}
          </div>
          <style>{`
            .no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
            .no-scrollbar::-webkit-scrollbar { display: none; }
          `}</style>
        </div>

        <div className="hidden sm:grid sm:grid-cols-2 xl:grid-cols-4 gap-px bg-[rgba(11,15,14,0.12)] border border-[rgba(11,15,14,0.12)]">
          {rows.map((row) => (
            <ProductCard
              key={row.catalog.handle}
              product={row.live}
              dossierNumber={
                EDITION_01_PRODUCTS.findIndex((entry) => entry.handle === row.catalog.handle) + 1
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}
