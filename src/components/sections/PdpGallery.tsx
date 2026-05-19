/**
 * `<PdpGallery />` — hero image plus a horizontal thumbnail carousel.
 *
 * Presentational client component. State (selected colorway image swap) is
 * owned by the parent `<PdpHero />` so the gallery and buy box stay in sync
 * without a context. The hero image is set with `priority` so it counts
 * toward LCP; thumbs are lazy. The active thumb is highlighted; clicking a
 * non-active thumb fires `onSelect(url)` so the parent can swap the hero.
 */

'use client';

import Image from 'next/image';

import type { ProductImage } from '@/lib/types/product';
import type { ReactElement } from 'react';

export type PdpGalleryProps = {
  readonly title: string;
  /** Active hero image URL. Swaps when a colorway swatch or thumb is clicked. */
  readonly heroImageUrl: string;
  /** Up to 4 alt-angle thumbs. Excludes whatever the hero is currently showing. */
  readonly tiles: readonly ProductImage[];
  /** Called when a non-active thumb is clicked. */
  readonly onSelect?: (imageUrl: string) => void;
};

export function PdpGallery({
  title,
  heroImageUrl,
  tiles,
  onSelect,
}: PdpGalleryProps): ReactElement {
  // Strip = [hero, ...tiles]. Hero is always first and highlighted.
  const thumbs = heroImageUrl
    ? [{ url: heroImageUrl, alt: title }, ...tiles.slice(0, 5)]
    : tiles.slice(0, 5);

  return (
    <div id="gallery" className="flex scroll-mt-[110px] flex-col gap-3">
      <div className="aspect-[3/4] overflow-hidden border border-[rgba(11,15,14,0.12)] bg-[var(--color-paper)]">
        {heroImageUrl ? (
          <Image
            src={heroImageUrl}
            alt={title}
            width={896}
            height={1200}
            priority
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="h-full w-full object-cover transition-transform duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.04]"
          />
        ) : null}
      </div>

      {thumbs.length > 1 ? (
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          role="tablist"
          aria-label={`${title} gallery thumbnails`}
        >
          {thumbs.map((thumb, index) => {
            const isActive = thumb.url === heroImageUrl;
            return (
              <button
                key={`${thumb.url}-${index}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`View ${title} image ${index + 1}`}
                onClick={() => {
                  if (!isActive && onSelect) onSelect(thumb.url);
                }}
                className={`group/thumb relative h-20 w-16 flex-shrink-0 overflow-hidden border bg-[var(--color-paper)] transition-[border-color] duration-200 sm:h-24 sm:w-20 ${
                  isActive
                    ? 'border-[var(--color-ink)]'
                    : 'cursor-pointer border-[rgba(11,15,14,0.12)] hover:border-[rgba(11,15,14,0.4)]'
                }`}
              >
                <Image
                  src={thumb.url}
                  alt=""
                  width={200}
                  height={250}
                  loading="lazy"
                  sizes="80px"
                  className={`h-full w-full object-cover transition-transform duration-300 ${
                    isActive ? '' : 'group-hover/thumb:scale-[1.04]'
                  }`}
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
