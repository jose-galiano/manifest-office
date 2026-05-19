/**
 * Dynamic OG image for `/products/[handle]`.
 *
 * 1200×630 product card composed at the edge with `next/og`. Critical for
 * agentic-commerce link previews: when an AI agent (Claude, ChatGPT) shares
 * a dossier URL it surfaces this image, not a generic site card.
 *
 * Layout: left half = product photo, right half = title + price + brand
 * wordmark. Brand palette is hardcoded because `next/og` cannot read CSS
 * variables (the runtime is Edge/Satori, not the browser).
 */

import { ImageResponse } from 'next/og';

import { EDITION_01, findProductByHandle } from '@/content/manifest-office';
import { fetchManifestProducts } from '@/lib/services/fetch-products';
import { toShopifyHandle } from '@/lib/shopify/handle';

export const runtime = 'edge';

export const size = {
  width: 1200,
  height: 630,
} as const;

export const contentType = 'image/png';

export const alt = 'Manifest Office dossier';

type OgImageParams = { readonly handle: string };

type OgImageProps = {
  readonly params: Promise<OgImageParams>;
};

const COLOR_INK = '#0B0F0E';
const COLOR_PAPER = '#F2EFE8';
const COLOR_SIGNAL = '#D24A1F';
const COLOR_LICHEN = '#5C6B5A';

export default async function ProductOpenGraphImage({
  params,
}: OgImageProps): Promise<ImageResponse> {
  const { handle } = await params;
  const catalogEntry = findProductByHandle(handle);

  const fetchResult = await fetchManifestProducts();
  const shopifyHandle = catalogEntry ? toShopifyHandle(catalogEntry.handle) : null;
  const product =
    shopifyHandle && fetchResult.ok
      ? fetchResult.data.products.find((candidate) => candidate.handle === shopifyHandle)
      : null;

  const title = catalogEntry?.title ?? product?.title ?? 'Dossier';
  const priceLabel = `€${Math.round(product?.price ?? catalogEntry?.priceEur ?? 0)}`;
  const dossierLabel = catalogEntry
    ? `DOSSIER ${String(catalogEntry.dossierNumber).padStart(2, '0')}`
    : 'DOSSIER';
  const editionLabel = `EDITION ${EDITION_01.number} · GIBRALTAR`;
  const imageUrl = product?.image ?? product?.images[0]?.url ?? null;

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        backgroundColor: COLOR_PAPER,
        color: COLOR_INK,
        fontFamily: 'sans-serif',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 40,
          left: 48,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontSize: 18,
          letterSpacing: 4,
          textTransform: 'uppercase',
          color: COLOR_INK,
        }}
      >
        <span style={{ fontWeight: 700 }}>Manifest Office</span>
      </div>

      <div
        style={{
          width: '50%',
          height: '100%',
          display: 'flex',
          backgroundColor: '#eae5dc',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            width={600}
            height={630}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span style={{ fontSize: 24, color: COLOR_LICHEN, letterSpacing: 4 }}>
            {dossierLabel}
          </span>
        )}
      </div>

      <div
        style={{
          width: '50%',
          height: '100%',
          padding: '120px 60px 60px 60px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              fontSize: 18,
              letterSpacing: 4,
              textTransform: 'uppercase',
              color: COLOR_SIGNAL,
              marginBottom: 18,
            }}
          >
            {dossierLabel}
          </span>
          <span
            style={{
              fontSize: 72,
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: -2,
              color: COLOR_INK,
            }}
          >
            {title}
          </span>
          <span
            style={{
              fontSize: 56,
              fontWeight: 700,
              lineHeight: 1,
              marginTop: 40,
              color: COLOR_INK,
            }}
          >
            {priceLabel}
          </span>
          <span
            style={{
              fontSize: 16,
              letterSpacing: 3,
              textTransform: 'uppercase',
              color: COLOR_LICHEN,
              marginTop: 12,
            }}
          >
            EUR · INCL. VAT
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span
            style={{
              fontSize: 14,
              letterSpacing: 3,
              textTransform: 'uppercase',
              color: COLOR_LICHEN,
            }}
          >
            {editionLabel}
          </span>
          <span
            style={{
              fontSize: 14,
              letterSpacing: 3,
              textTransform: 'uppercase',
              color: COLOR_LICHEN,
            }}
          >
            Finished in Porto · 1,200 issued
          </span>
        </div>
      </div>
    </div>,
    { ...size },
  );
}
