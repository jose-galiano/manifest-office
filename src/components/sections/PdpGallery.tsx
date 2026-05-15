/**
 * `<PdpGallery />` — hero image plus four secondary tiles.
 *
 * Presentational client component. State (selected colorway image swap) is
 * owned by the parent `<PdpHero />` so the gallery and buy box stay in sync
 * without a context. The hero image is set with `priority` so it counts
 * toward LCP; tiles are lazy. On scroll past the hero the gallery sticks
 * within its column on desktop (matches legacy `.gallery { position: sticky }`
 * via the parent grid).
 */

'use client';

import Image from 'next/image';

import type { ProductImage } from '@/lib/types/product';
import type { ReactElement } from 'react';

export type PdpGalleryProps = {
  readonly title: string;
  /** Active hero image URL. Swaps when a colorway swatch is clicked. */
  readonly heroImageUrl: string;
  /** Up to 4 secondary tiles. Excludes whatever the hero is currently showing. */
  readonly tiles: readonly ProductImage[];
};

export function PdpGallery({ title, heroImageUrl, tiles }: PdpGalleryProps): ReactElement {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="col-span-2 aspect-[4/3] overflow-hidden border border-[rgba(11,15,14,0.12)] bg-[#eae5dc]">
        {heroImageUrl ? (
          <Image
            src={heroImageUrl}
            alt={title}
            width={1200}
            height={900}
            priority
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="h-full w-full object-cover transition-transform duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.04]"
          />
        ) : null}
      </div>

      {tiles.slice(0, 4).map((tile, index) => (
        <div
          // Some Shopify CDN URLs collide (variant alt-text duplicates); fall back to index.
          key={`${tile.url}-${index}`}
          className="aspect-square overflow-hidden border border-[rgba(11,15,14,0.12)] bg-[#eae5dc]"
        >
          <Image
            src={tile.url}
            alt={tile.alt || title}
            width={600}
            height={600}
            loading="lazy"
            sizes="(max-width: 1024px) 50vw, 25vw"
            className="h-full w-full object-cover transition-transform duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.06]"
          />
        </div>
      ))}
    </div>
  );
}
