import { notFound } from 'next/navigation';

import { CollectionHeader } from '@/components/sections/CollectionHeader';
import { ProductGrid } from '@/components/sections/ProductGrid';
import {
  COLLECTIONS,
  EDITION_01,
  findCollectionByHandle,
  findProductByShopifyHandle,
  type Collection,
} from '@/content/manifest-office';
import { JsonLd, buildBreadcrumbList, buildOfferCatalog } from '@/lib/seo';
import { fetchManifestProducts } from '@/lib/services/fetch-products';

import type { ManifestProduct } from '@/lib/types/product';
import type { Metadata } from 'next';
import type { ReactElement } from 'react';

// Fresh allocation counters per request. The legacy `dossiers.html` makes
// this same call client-side; we promote it to the server render so the page
// HTML always carries the current value.
export const dynamic = 'force-dynamic';

type CollectionPageParams = { readonly handle: string };

type CollectionPageProps = {
  readonly params: Promise<CollectionPageParams>;
};

export function generateStaticParams(): CollectionPageParams[] {
  return COLLECTIONS.map((collection) => ({ handle: collection.handle }));
}

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const { handle } = await params;
  const collection = findCollectionByHandle(handle);
  if (!collection) {
    return { title: 'Collection not found' };
  }
  return {
    title: collection.title,
    description: collection.summary,
  };
}

// Eyebrows aren't on the canonical `Collection` shape yet — derive from the
// edition metadata for the marquee Edition page; everything else gets a
// category-style eyebrow.
function eyebrowFor(collection: Collection): string {
  if (collection.handle === 'edition-01') {
    return `EDITION ${EDITION_01.number} / GIBRALTAR · ${EDITION_01.coordinates}`;
  }
  if (collection.handle === 'all') {
    return 'CATALOGUE / ALL EDITIONS';
  }
  return `COMPONENT / ${collection.title.toUpperCase()}`;
}

function filterProductsForCollection(
  allProducts: readonly ManifestProduct[],
  collection: Collection,
): ManifestProduct[] {
  // The `ManifestProduct.handle` field carries the Shopify handle (with
  // `manifest-` prefix). The catalog maps storefront ↔ Shopify handles, so
  // we look each one up to filter. Order follows `collection.productHandles`
  // so editorial ordering survives.
  const matches: ManifestProduct[] = [];
  for (const storefrontHandle of collection.productHandles) {
    const match = allProducts.find((candidate) => {
      const catalogEntry = findProductByShopifyHandle(candidate.handle);
      return catalogEntry?.handle === storefrontHandle;
    });
    if (match) {
      matches.push(match);
    }
  }
  return matches;
}

function summariseIssued(products: readonly ManifestProduct[]): number {
  if (products.length === 0) {
    return 0;
  }
  // Edition counter is shared across SKUs; max is defensive in case one SKU
  // reports a stale value while another is fresh.
  return products.reduce((highest, product) => Math.max(highest, product.editionIssued), 0);
}

export default async function CollectionPage({
  params,
}: CollectionPageProps): Promise<ReactElement> {
  const { handle } = await params;
  const collection = findCollectionByHandle(handle);
  if (!collection) {
    notFound();
  }

  const fetchResult = await fetchManifestProducts();
  const allProducts: readonly ManifestProduct[] = fetchResult.ok ? fetchResult.data.products : [];
  const products = filterProductsForCollection(allProducts, collection);
  const issued = summariseIssued(allProducts);
  const total = allProducts[0]?.editionTotal ?? EDITION_01.totalAllocation;

  const showAllocationBanner = collection.handle === 'edition-01';

  const meta =
    collection.handle === 'edition-01'
      ? ([
          { term: 'Anchor', value: EDITION_01.anchor },
          { term: 'Accent', value: EDITION_01.accentName },
          { term: 'Allocation', value: `${total.toLocaleString('en-GB')} systems` },
          { term: 'Issued from', value: `${EDITION_01.issuedFrom} · ${EDITION_01.shipsBy}` },
        ] as const)
      : undefined;

  return (
    <main className="min-h-screen bg-[#F2EFE8] text-[#0B0F0E]">
      <CollectionHeader
        eyebrow={eyebrowFor(collection)}
        title={collection.title}
        summary={collection.summary}
        meta={meta}
        allocation={
          showAllocationBanner
            ? {
                issued,
                total,
                editionLabel: `EDITION ${EDITION_01.number} — GIBRALTAR`,
                originLabel: `ISSUED FROM ${EDITION_01.issuedFrom.toUpperCase()}`,
                shipsInLabel: `SHIPS IN ${EDITION_01.shipLeadDays} BUSINESS DAYS`,
              }
            : undefined
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-y-2 border-b border-[rgba(11,15,14,0.12)] px-10 py-4 font-mono text-[11px] uppercase tracking-[0.06em]">
        <div className="flex flex-wrap items-center gap-6 text-[#5C6B5A]">
          <span className="text-[#0B0F0E]">
            {String(products.length).padStart(2, '0')} DOSSIERS
          </span>
          <span>ALL · CUBES · POUCHES · CARRY · HARDWARE</span>
        </div>
      </div>

      <div className="mx-auto max-w-[1800px]">
        <ProductGrid products={products} />
      </div>

      <JsonLd id="collection-jsonld" schema={buildOfferCatalog(collection, products)} />
      <JsonLd
        id="collection-breadcrumb-jsonld"
        schema={buildBreadcrumbList([
          { name: 'Manifest Office', url: '/' },
          { name: 'Collections', url: '/collections' },
          { name: collection.title, url: `/collections/${collection.handle}` },
        ])}
      />
    </main>
  );
}
