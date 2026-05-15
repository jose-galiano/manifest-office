import Image from 'next/image';

import { Eyebrow } from '@/components/ui/Eyebrow';

import type { ReactElement } from 'react';

// Anchor Latch deep-dive hero + parts dossier for /pages/system.

const META_ROWS: readonly { key: string; value: string }[] = [
  { key: 'PATENT', value: 'EU 2026-04 · pending' },
  { key: 'CYCLE TEST', value: '25,000 engagements without failure' },
  { key: 'TOLERANCE', value: '±0.8mm hook geometry' },
  { key: 'MADE IN', value: 'Northern Portugal' },
];

interface PartRow {
  readonly term: string;
  readonly definition: string;
  readonly accent?: boolean;
}

const PARTS: readonly PartRow[] = [
  { term: '01 · Body', definition: '6061-T6 brushed graphite anodized aluminum' },
  { term: '02 · Magnet', definition: 'N52 neodymium · sealed and encapsulated' },
  { term: '03 · Anchor plate', definition: '6061-T6 aluminum · counterpart catch' },
  { term: '04 · Lever', definition: 'Anodized aluminum · signal-orange release', accent: true },
  { term: '05 · Hook', definition: 'CNC machined · 0.8mm tolerance' },
  { term: '06 · Pivot pin', definition: '316 stainless · pressed fit · field-serviceable' },
];

export function SystemAnchorLatch(): ReactElement {
  return (
    <>
      <section className="relative overflow-hidden bg-[#0B0F0E] px-5 md:px-10 pt-[110px] md:pt-[140px] pb-14 md:pb-[100px] text-[#F2EFE8]">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-end gap-20 md:grid-cols-2">
          <div>
            <Eyebrow className="mb-8 block" flanked>
              THE ANCHOR LATCH · MO-A1
            </Eyebrow>
            <h1 className="mb-8 font-display font-bold leading-[0.88] tracking-[-0.035em] text-[clamp(40px,6.5vw,96px)]">
              One closure.
              <br />
              Every <span className="text-[#D24A1F]">component</span>.
              <br />
              The system holds.
            </h1>
            <p className="mb-8 max-w-[36ch] font-display text-[clamp(20px,2vw,26px)] font-normal leading-[1.3] text-[#F2EFE8]/85">
              A hybrid magnetic and mechanical latch shared across every Dossier in the system. The
              Tech Pouch locks to the Cube. The Cube locks to the Field Tote. One geometry. One
              motion. One click.
            </p>
            <dl className="font-mono text-[11px] tracking-[0.06em] uppercase leading-[1.8] text-[#5C6B5A]">
              {META_ROWS.map((row) => (
                <div key={row.key}>
                  <span className="mr-3.5 text-[#F2EFE8]">{row.key}</span>
                  {row.value}
                </div>
              ))}
            </dl>
          </div>
          <div className="aspect-square overflow-hidden bg-[#F2EFE8]">
            <Image
              src="/images/mood-board/v1/13-anchor-latch-detail.png"
              alt="The Anchor Latch detail"
              width={1200}
              height={1200}
              className="h-full w-full object-cover"
              priority
            />
          </div>
        </div>
      </section>

      <section className="bg-[#F2EFE8] px-5 md:px-10 py-20 md:py-[140px]">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-24 grid grid-cols-1 items-end gap-20 md:grid-cols-2">
            <div>
              <Eyebrow className="mb-6 block" flanked>
                SIX PARTS
              </Eyebrow>
              <h2 className="font-display font-bold leading-[0.95] tracking-[-0.02em] text-[clamp(40px,5vw,72px)]">
                Documented.
                <br />
                To the millimeter.
              </h2>
            </div>
            <p className="max-w-[44ch] text-[17px] leading-[1.6]">
              Six machined and stamped components. No moulded plastic. No proprietary screws. If a
              part fails, you can replace it. If the magnet weakens after twenty years, you can swap
              it. The latch is built to be repaired, not replaced.
            </p>
          </div>
          <div className="grid grid-cols-1 items-center gap-20 md:grid-cols-2">
            <div className="aspect-square overflow-hidden">
              <Image
                src="/images/mood-board/v1/07-hands-anchor-latch.png"
                alt="Hands engaging the Anchor Latch"
                width={1200}
                height={1200}
                className="h-full w-full object-cover"
              />
            </div>
            <dl className="grid grid-cols-[140px_1fr] gap-x-8 gap-y-4 font-mono text-[12px] tracking-[0.04em] uppercase">
              {PARTS.map((part) => (
                <div key={part.term} className="contents">
                  <dt className={part.accent ? 'text-[#D24A1F]' : 'text-[#5C6B5A]'}>{part.term}</dt>
                  <dd className={part.accent ? 'text-[#D24A1F]' : 'text-[#0B0F0E]'}>
                    {part.definition}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>
    </>
  );
}
