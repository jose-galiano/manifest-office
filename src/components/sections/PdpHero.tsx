/**
 * `<PdpHero />` — two-column hero: gallery (left) + buybox (right).
 *
 * Owns the *shared* state between gallery and buybox: when a colorway
 * swatch is clicked the buybox bubbles the change up here, and the
 * gallery hero image swaps to the variant's image. Everything else stays
 * stateless in its child component.
 *
 * Ported from `deploy/pdp.html` `<section class="hero">` plus the
 * `wireColorwaySwatches()` / `pickGalleryImages()` IIFE helpers
 * (lines 1524-1593).
 */

'use client';

import { useMemo, useState } from 'react';

import { PdpBuybox, type ColorwaySwatch, type SizeOption } from '@/components/sections/PdpBuybox';
import { PdpGallery } from '@/components/sections/PdpGallery';

import type { ProductImage } from '@/lib/types/product';
import type { ReactElement } from 'react';

export type PdpHeroProps = {
  readonly storefrontHandle: string;
  readonly shopifyHandle: string;
  readonly title: string;
  readonly priceEur: number;
  readonly summary: string;
  readonly editionNumber: string;
  readonly dossierNumber: number;
  readonly heroImage: string;
  readonly tiles: readonly ProductImage[];
  readonly sizeOptions: readonly SizeOption[];
  readonly colorways: readonly ColorwaySwatch[];
  /**
   * Name of the colorway the page should land on. Resolved server-side from
   * the `?color=` query (set by the PLP card when the customer picked a
   * non-default swatch). When absent, defaults to the first colorway.
   */
  readonly initialColorwayName?: string;
  readonly issued: number;
  readonly total: number;
};

export function PdpHero(props: PdpHeroProps): ReactElement {
  const {
    storefrontHandle,
    shopifyHandle,
    title,
    priceEur,
    summary,
    editionNumber,
    dossierNumber,
    heroImage,
    tiles,
    sizeOptions,
    colorways,
    initialColorwayName,
    issued,
    total,
  } = props;

  const [activeImage, setActiveImage] = useState<string>(heroImage);

  // When the gallery is showing the active variant image we want the tile
  // strip to *exclude* that image so the same shot isn't repeated.
  const filteredTiles = useMemo<readonly ProductImage[]>(
    () => tiles.filter((tile) => tile.url !== activeImage),
    [tiles, activeImage],
  );

  const handleColorwayChange = (colorway: ColorwaySwatch): void => {
    if (colorway.imageUrl) {
      setActiveImage(colorway.imageUrl);
    }
  };

  return (
    <section className="grid gap-12 px-5 md:px-10 pb-16 pt-8 lg:grid-cols-[1.4fr_1fr]">
      <PdpGallery title={title} heroImageUrl={activeImage} tiles={filteredTiles} />
      <PdpBuybox
        storefrontHandle={storefrontHandle}
        shopifyHandle={shopifyHandle}
        title={title}
        priceEur={priceEur}
        summary={summary}
        editionNumber={editionNumber}
        dossierNumber={dossierNumber}
        imageUrl={activeImage}
        sizeOptions={sizeOptions}
        colorways={colorways}
        initialColorwayName={initialColorwayName}
        issued={issued}
        total={total}
        onColorwayChange={handleColorwayChange}
      />
    </section>
  );
}
