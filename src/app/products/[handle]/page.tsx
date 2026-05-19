/**
 * `/products/[handle]` — Product Detail Page.
 *
 * Server component. Pulls live Shopify data through `fetchManifestProducts()`
 * (the same single batched query the PLP uses, so the response stays warm in
 * the Next data cache for the visit). The page itself is thin per Maelify
 * §1: no GraphQL, no business logic, only composition.
 *
 * Ported from `deploy/pdp.html` (≈2400 LOC IIFE → typed React tree). The
 * legacy file conflated the canvas hero, the buybox closure, the cart
 * drawer, the WebGL latch viewer, the trip packer and the desk recommender
 * into a single script. The Wave-3 plan splits each concern into its own
 * component (3A buybox, 3B cart, 3C 3D-viewer + build-system, 3D desk
 * brief + SEO). This file is the 3A composition.
 */

import { notFound } from 'next/navigation';

import { BuildYourSystem } from '@/components/sections/BuildYourSystem';
import { DeskBrief } from '@/components/sections/DeskBrief';
import { DossierHeader } from '@/components/sections/DossierHeader';
import { ExplodedLatchViewer } from '@/components/sections/ExplodedLatchViewer';
import { PdpDossierBody } from '@/components/sections/PdpDossierBody';
import { PdpHero } from '@/components/sections/PdpHero';
import { PdpSpecs, type PdpSpec } from '@/components/sections/PdpSpecs';
import { ScrollLatchReveal } from '@/components/sections/ScrollLatchReveal';
import {
  EDITION_01,
  EDITION_01_PRODUCTS,
  findProductByHandle,
  type Product,
} from '@/content/manifest-office';
import { resolveColorwayHex } from '@/lib/constants/colorways';
import { JsonLd, buildBreadcrumbList, buildProductSchema } from '@/lib/seo';
import { fetchManifestProducts } from '@/lib/services/fetch-products';
import { toShopifyHandle } from '@/lib/shopify/handle';

import type { ColorwaySwatch, SizeOption } from '@/components/sections/PdpBuybox';
import type { ManifestProduct, ProductImage } from '@/lib/types/product';
import type { Metadata } from 'next';
import type { ReactElement } from 'react';

// Allocation is refreshed on every request (issue numbers and inventory
// counts change in real time). Matches the legacy client-side polling
// behaviour but lifts it server-side so the HTML always carries the
// current value.
export const dynamic = 'force-dynamic';

type PdpParams = { readonly handle: string };

type PdpSearchParams = { readonly color?: string };

type PdpPageProps = {
  readonly params: Promise<PdpParams>;
  readonly searchParams?: Promise<PdpSearchParams>;
};

// Static-generation hint. Even with `force-dynamic`, declaring the known
// handles helps Next pre-validate the route shape and gives the
// `not-found` 404 path the right boundary.
export function generateStaticParams(): PdpParams[] {
  return EDITION_01_PRODUCTS.map((product) => ({ handle: product.handle }));
}

export async function generateMetadata({ params }: PdpPageProps): Promise<Metadata> {
  const { handle } = await params;
  const catalogEntry = findProductByHandle(handle);
  if (!catalogEntry) {
    return { title: 'Dossier not found' };
  }

  const ogImageUrl = `/products/${handle}/opengraph-image`;
  const description = `${catalogEntry.title} — Edition ${EDITION_01.number}. ${catalogEntry.use}. Finished in Porto.`;
  const canonicalPath = `/products/${handle}`;

  return {
    title: `${catalogEntry.title} · Manifest Office`,
    description,
    alternates: { canonical: canonicalPath },
    robots: { index: true, follow: true },
    openGraph: {
      type: 'website',
      title: catalogEntry.title,
      description,
      url: canonicalPath,
      siteName: 'Manifest Office',
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: catalogEntry.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: catalogEntry.title,
      description,
      images: [ogImageUrl],
    },
  };
}

// ---------------------------------------------------------------------------
// Catalog-derived spec strip. Six cells matches `deploy/pdp.html` §specs.
// Values that aren't shipped on the catalogue entry (material, closure,
// zipper, mass, origin) default to the Edition 01 baseline. Wave 4 will add
// per-product overrides when the rich dossier body is authored.
// ---------------------------------------------------------------------------
function buildSpecStrip(catalogEntry: Product, shopifyProduct: ManifestProduct | null): PdpSpec[] {
  const volume = catalogEntry.volume === '—' ? '—' : `${catalogEntry.volume}`;
  const isHardware =
    catalogEntry.handle === 'anchor-latch' || catalogEntry.handle === 'luggage-tag';
  return [
    {
      icon: 'material',
      label: 'Material',
      value: isHardware ? '6061-T6 Aluminium' : '420D Cordura',
    },
    { icon: 'closure', label: 'Closure', value: 'Anchor Latch' },
    { icon: 'zipper', label: 'Zipper', value: isHardware ? '—' : 'YKK AquaGuard' },
    { icon: 'volume', label: 'Volume', value: volume },
    { icon: 'mass', label: 'Mass', value: shopifyProduct?.volume ?? '—' },
    { icon: 'origin', label: 'Origin', value: 'Porto · EU' },
  ];
}

// ---------------------------------------------------------------------------
// Sibling size lookup. Only `cube-*` and `tech-pouch-*` ship a S/M/L lineup.
// Other dossiers return an empty array, which the buybox renders as "no SIZE
// block" — same behaviour as legacy `selectVariant()` lines 1633-1641.
// ---------------------------------------------------------------------------
function deriveSizeOptions(currentHandle: string): SizeOption[] {
  const cubeSiblings: readonly Product[] = EDITION_01_PRODUCTS.filter((entry) =>
    entry.handle.startsWith('cube-'),
  );
  const pouchSiblings: readonly Product[] = EDITION_01_PRODUCTS.filter((entry) =>
    entry.handle.startsWith('tech-pouch-'),
  );

  let siblings: readonly Product[] = [];
  if (currentHandle.startsWith('cube-')) siblings = cubeSiblings;
  else if (currentHandle.startsWith('tech-pouch-')) siblings = pouchSiblings;
  if (siblings.length === 0) return [];

  return siblings.map((sibling) => {
    const sizeToken = sibling.title.split('·').slice(-1)[0]?.trim() ?? '';
    return {
      storefrontHandle: sibling.handle,
      label: `${sizeToken} · ${sibling.volume}`,
    };
  });
}

function deriveColorways(shopifyProduct: ManifestProduct | null): ColorwaySwatch[] {
  if (!shopifyProduct) return [];
  const names = shopifyProduct.colorways.length > 0 ? shopifyProduct.colorways : ['Charcoal'];
  return names.map((name) => {
    const variant = shopifyProduct.variants.find((candidate) =>
      candidate.selectedOptions.some(
        (option) => option.name.toLowerCase() === 'colorway' && option.value === name,
      ),
    );
    return {
      name,
      hex: resolveColorwayHex(name),
      imageUrl: variant?.image ?? null,
    };
  });
}

// ---------------------------------------------------------------------------
// Gallery image selection. The legacy `pickGalleryImages()` (lines 1524-1542)
// re-implemented this in vanilla JS; we move it server-side so the first
// paint already carries the correct ordering.
// ---------------------------------------------------------------------------
function selectGalleryImages(
  shopifyProduct: ManifestProduct | null,
  catalogTitle: string,
): { hero: string; tiles: ProductImage[] } {
  const fallbackHero = '/images/v2/maker-cristina.png';
  if (!shopifyProduct) {
    return { hero: fallbackHero, tiles: [] };
  }
  const isColor = (url: string): boolean => /-colorway-/i.test(url);
  const all = shopifyProduct.images.filter((image) => image.url && !isColor(image.url));
  const hero = shopifyProduct.image ?? all[0]?.url ?? fallbackHero;
  const seen = new Set<string>([hero]);
  const tiles: ProductImage[] = [];
  for (const image of all) {
    if (seen.has(image.url)) continue;
    seen.add(image.url);
    tiles.push({ url: image.url, alt: image.alt || catalogTitle });
    if (tiles.length >= 4) break;
  }
  return { hero, tiles };
}

export default async function ProductDetailPage({
  params,
  searchParams,
}: PdpPageProps): Promise<ReactElement> {
  const { handle } = await params;
  const search = (await searchParams) ?? {};
  const catalogEntry = findProductByHandle(handle);
  if (!catalogEntry) {
    notFound();
  }

  const shopifyHandle = toShopifyHandle(catalogEntry.handle);
  const fetchResult = await fetchManifestProducts();
  const shopifyProduct: ManifestProduct | null = fetchResult.ok
    ? (fetchResult.data.products.find((candidate) => candidate.handle === shopifyHandle) ?? null)
    : null;

  const priceEur = shopifyProduct?.price ?? catalogEntry.priceEur;
  const issued = shopifyProduct?.editionIssued ?? 0;
  const total = shopifyProduct?.editionTotal ?? EDITION_01.totalAllocation;

  const gallery = selectGalleryImages(shopifyProduct, catalogEntry.title);
  const colorways = deriveColorways(shopifyProduct);
  const sizeOptions = deriveSizeOptions(catalogEntry.handle);
  const specs = buildSpecStrip(catalogEntry, shopifyProduct);

  // Resolve the requested colorway (e.g. `?color=lichen` from the PLP card).
  // Match case-insensitively; if the param is missing/unknown, fall back to
  // the default (first) colorway so the page lands on a coherent variant.
  const requestedColorway = (search.color ?? '').toLowerCase().trim();
  const initialColorway =
    (requestedColorway
      ? colorways.find((swatch) => swatch.name.toLowerCase() === requestedColorway)
      : null) ?? colorways[0];
  const initialHeroImage = initialColorway?.imageUrl ?? gallery.hero;

  const summary = `${catalogEntry.title} — ${catalogEntry.use}. Anchor-Latch compatible with every component of the Manifest Office system. Issued from Porto for ${EDITION_01.shipsBy}.`;

  const skuRef =
    shopifyProduct?.sku ?? `MO-${EDITION_01.number}-${catalogEntry.handle.toUpperCase()}`;
  const dossierMeta = [
    { label: `DOSSIER ${String(catalogEntry.dossierNumber).padStart(2, '0')}` },
    { label: `REF ${skuRef}` },
    { label: `VOLUME ${catalogEntry.volume}` },
    { label: `ISSUED ${EDITION_01.issuedFrom.toUpperCase()} · ${EDITION_01.shipsBy}` },
  ];

  return (
    <main className="bg-[#F2EFE8] text-[#0B0F0E]">
      <DossierHeader
        title={catalogEntry.title.toUpperCase()}
        dossierNumber={catalogEntry.dossierNumber}
        editionNumber={EDITION_01.number}
        meta={dossierMeta}
      />

      <PdpHero
        storefrontHandle={catalogEntry.handle}
        shopifyHandle={shopifyHandle}
        title={catalogEntry.title}
        priceEur={priceEur}
        summary={summary}
        editionNumber={EDITION_01.number}
        dossierNumber={catalogEntry.dossierNumber}
        heroImage={initialHeroImage}
        tiles={gallery.tiles}
        sizeOptions={sizeOptions}
        colorways={colorways}
        initialColorwayName={initialColorway?.name}
        issued={issued}
        total={total}
      />

      <PdpSpecs specs={specs} />

      <PdpDossierBody title={catalogEntry.title} />

      {catalogEntry.handle === 'anchor-latch' ? <ScrollLatchReveal /> : null}

      <ExplodedLatchViewer />

      <BuildYourSystem />

      <DeskBrief />

      {shopifyProduct ? (
        <JsonLd id="product-jsonld" schema={buildProductSchema(shopifyProduct)} />
      ) : null}
      <JsonLd
        id="product-breadcrumb-jsonld"
        schema={buildBreadcrumbList([
          { name: 'Manifest Office', url: '/' },
          { name: 'Edition 01 — Gibraltar', url: '/collections/edition-01' },
          { name: catalogEntry.title, url: `/products/${catalogEntry.handle}` },
        ])}
      />
    </main>
  );
}
