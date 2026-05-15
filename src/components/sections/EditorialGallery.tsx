/**
 * `<EditorialGallery />` — horizontal-scroll mood-board strip.
 *
 * A purely visual break between the Manifesto and the EditionFeature blocks
 * to lift the homepage out of its top-to-bottom text rhythm. Pulls from the
 * Edition 01 mood-board library (brand bible §09 photography directions).
 *
 * Implementation:
 *  - 7 portrait + landscape cards, mixed aspect ratios for visual cadence.
 *  - CSS scroll-snap rail (`<HorizontalScroll>`), keyboard + arrow chrome on
 *    desktop, swipe-only on mobile.
 *  - First card pulls a wider portrait so the strip starts with an "anchor"
 *    image, then alternates.
 */

import Image from 'next/image';

import { HorizontalScroll } from '@/components/ui/HorizontalScroll';

import type { ReactElement } from 'react';

interface GalleryItem {
  readonly src: string;
  readonly alt: string;
  readonly caption: string;
  readonly register: 'Studio' | 'Field' | 'Kinesthetic' | 'Atelier';
  readonly aspect: 'portrait' | 'landscape';
}

const ITEMS: readonly GalleryItem[] = [
  {
    src: '/images/mood-board/editorial/01-anchor-latch-hero.png',
    alt: 'Anchor Latch MO-A1 suspended on a charcoal paracord loop',
    caption: 'Anchor Latch · MO-A1 · 6061-T6 aluminum',
    register: 'Studio',
    aspect: 'landscape',
  },
  {
    src: '/images/mood-board/editorial/03-porto-rooftop-dawn.png',
    alt: 'Tech pouch on a weathered Porto rooftop parapet at dawn',
    caption: 'Field document · Porto · 41°08′N',
    register: 'Field',
    aspect: 'portrait',
  },
  {
    src: '/images/mood-board/editorial/02-paracord-zipper-macro.png',
    alt: 'Fingertips threading a signal-orange paracord through a YKK zipper slider',
    caption: 'YKK AquaGuard · paracord pull · by hand',
    register: 'Kinesthetic',
    aspect: 'landscape',
  },
  {
    src: '/images/mood-board/editorial/04-atelier-qc-bench.png',
    alt: 'QC bench: brass paperweight, fountain pen, digital caliper, stacked tech pouches',
    caption: 'QC bench · sample-room Porto',
    register: 'Atelier',
    aspect: 'portrait',
  },
  {
    src: '/images/mood-board/editorial/05-gibraltar-ferry-stern.png',
    alt: 'Operator at a ferry stern looking south across the Strait of Gibraltar',
    caption: 'Strait of Gibraltar · ferry stern · 36°08′N',
    register: 'Field',
    aspect: 'landscape',
  },
  {
    src: '/images/mood-board/editorial/06-studio-hardware-inventory.png',
    alt: 'Hardware inventory flatlay: loupe, anchor weight, leather tag, zipper pulls, pen',
    caption: 'Hardware inventory · Edition 01',
    register: 'Studio',
    aspect: 'landscape',
  },
  {
    src: '/images/mood-board/editorial/07-hand-latch-lever.png',
    alt: 'Thumb pressing the signal-orange lever of the Anchor Latch',
    caption: 'Anchor Latch · the click · MO-A1',
    register: 'Kinesthetic',
    aspect: 'portrait',
  },
];

function widthFor(aspect: GalleryItem['aspect']): string {
  return aspect === 'portrait'
    ? 'w-[260px] sm:w-[320px] md:w-[360px]'
    : 'w-[360px] sm:w-[480px] md:w-[560px]';
}

function aspectFor(aspect: GalleryItem['aspect']): string {
  return aspect === 'portrait' ? 'aspect-[3/4]' : 'aspect-[3/2]';
}

export function EditorialGallery(): ReactElement {
  return (
    <section
      aria-label="Edition 01 editorial gallery"
      className="border-t border-[rgba(11,15,14,0.12)] bg-[#F2EFE8] py-16 md:py-[120px] text-[#0B0F0E]"
    >
      <header className="mx-auto mb-10 max-w-[1800px] px-5 md:px-10">
        <span className="mb-3 block font-mono text-[11px] tracking-[0.12em] uppercase text-[#D24A1F]">
          — EDITORIAL · EDITION 01 —
        </span>
        <h2 className="font-display font-bold leading-[0.95] tracking-[-0.02em] text-[clamp(32px,4.5vw,56px)]">
          The atelier, the field, the hand.
        </h2>
      </header>

      <div className="px-5 md:px-10">
        <HorizontalScroll ariaLabel="Edition 01 editorial gallery" tone="paper">
          {ITEMS.map((item) => (
            <figure key={item.src} className={`${widthFor(item.aspect)} shrink-0 snap-start`}>
              <div className={`${aspectFor(item.aspect)} overflow-hidden bg-[#eae5dc]`}>
                <Image
                  src={item.src}
                  alt={item.alt}
                  width={1200}
                  height={1600}
                  sizes="(max-width: 820px) 80vw, 560px"
                  className="h-full w-full object-cover"
                />
              </div>
              <figcaption className="mt-4 flex items-baseline justify-between gap-4 font-mono text-[10px] tracking-[0.08em] uppercase text-[#5C6B5A]">
                <span>{item.caption}</span>
                <span className="text-[#D24A1F]">{item.register}</span>
              </figcaption>
            </figure>
          ))}
        </HorizontalScroll>
      </div>
    </section>
  );
}
