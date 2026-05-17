import Image from 'next/image';

import { Eyebrow } from '@/components/ui/Eyebrow';

import type { ReactElement } from 'react';

// "Gibraltar. 1:250,000." section on the homepage — anchors Edition 01 to the
// strait and lists the five edition metadata rows. Static; no animation.
// TODO Agent-B: copy + DL pairs should pull from src/content/manifest-office.ts
// (EDITIONS.edition01) once that file lands.

const META_ROWS: readonly { term: string; definition: string }[] = [
  { term: 'Anchor', definition: 'Strait of Gibraltar' },
  { term: 'Accent', definition: 'Signal Orange · #D24A1F' },
  { term: 'Guest material', definition: 'Hypalon reinforcement' },
  { term: 'Allocation', definition: '1,200 systems · 00847 issued' },
  { term: 'Issued from', definition: 'Porto · 2026-Q2' },
];

export function EditionFeature(): ReactElement {
  return (
    <section className="border-t border-[rgba(242,239,232,0.18)] bg-[#0B0F0E] px-5 md:px-10 py-20 md:py-[160px] text-[#F2EFE8]">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-20 md:grid-cols-2">
        <div className="aspect-[3/4] overflow-hidden">
          <Image
            src="/images/mood-board/editorial/edition-folio.webp"
            alt="Edition 01 folio with brass anchor paperweight, wax seal, and fountain pen"
            width={900}
            height={1200}
            className="h-full w-full object-cover transition-transform duration-[1500ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.05]"
            priority={false}
          />
        </div>
        <div>
          <Eyebrow className="mb-6 block">THE EDITION · 01</Eyebrow>
          <h2 className="mb-8 font-display font-bold leading-[0.95] tracking-[-0.02em] text-[clamp(56px,7vw,96px)]">
            Gibraltar.
            <br />
            1:250,000.
          </h2>
          <p className="mb-6 max-w-[48ch] text-[18px] leading-[1.55] text-[#F2EFE8]/85">
            Every Edition anchors to a place. Edition 01 anchors to the Strait of Gibraltar, where
            the Mediterranean meets the Atlantic. The accent is signal orange. The guest material is
            Hypalon. The allocation is fixed at 1,200 systems.
          </p>
          <p className="mb-6 max-w-[48ch] text-[18px] leading-[1.55] text-[#F2EFE8]/85">
            When Edition 01 closes, Edition 02 opens. Different place. Different accent. Different
            guest material. The system remains.
          </p>
          <dl className="mt-12 grid grid-cols-[140px_1fr] gap-x-8 gap-y-3 border-t border-[rgba(242,239,232,0.18)] pt-8 font-mono text-[12px] tracking-[0.04em] uppercase">
            {META_ROWS.map((row) => (
              <div key={row.term} className="contents">
                <dt className="text-[#9CAA98]">{row.term}</dt>
                <dd className="text-[#F2EFE8]">{row.definition}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
