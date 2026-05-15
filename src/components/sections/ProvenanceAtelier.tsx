import Image from 'next/image';

import { Eyebrow } from '@/components/ui/Eyebrow';

import type { ReactElement } from 'react';

export function ProvenanceAtelier(): ReactElement {
  return (
    <section
      id="qc"
      className="border-t border-[rgba(11,15,14,0.12)] bg-[#F2EFE8] px-5 md:px-10 py-16 md:py-[120px] scroll-mt-[120px]"
    >
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-20 md:grid-cols-[1fr_1.2fr]">
        <div className="group aspect-[4/5] overflow-hidden">
          <Image
            src="/images/mood-board/v1/02-field-document-lisbon.webp"
            alt="Atelier Souto sample room"
            width={900}
            height={1125}
            className="h-full w-full object-cover transition-transform duration-[1500ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
          />
        </div>
        <div>
          <Eyebrow className="mb-6 block" flanked>
            THE ATELIER
          </Eyebrow>
          <h2 className="mb-8 font-display font-bold leading-[0.95] tracking-[-0.02em] text-[clamp(40px,5vw,72px)]">
            Atelier Souto.
            <br />
            Vila Nova de Famalicão.
          </h2>
          <p className="mb-4 max-w-[48ch] text-[17px] leading-[1.7]">
            A fourteen-person sample room and small-production atelier forty kilometres north of
            Porto. They have run cut-and-sew for two of the most-respected European outdoor brands
            for fifteen years. We will not name those brands. They will not name us until Edition 01
            closes.
          </p>
          <p className="mb-4 max-w-[48ch] text-[17px] leading-[1.7]">
            Every kit is cut, stitched, and inspected by hand on the same floor. The cycle is ten
            units a day, six days a week. The first sample of the Tech Pouch took forty-three
            iterations. We kept the seventh, ninth, and forty-third on display.
          </p>
          <div className="mt-10 font-mono text-[11px] tracking-[0.06em] uppercase leading-[1.8] text-[#5C6B5A]">
            <div>
              <span className="text-[#0B0F0E]">ATELIER SOUTO</span> · Vila Nova de Famalicão ·
              Portugal
            </div>
            <div>10 units/day · 6 days/week · 100% manual QC</div>
            <div>Sample iterations to Edition 01 release: 43</div>
          </div>
        </div>
      </div>
    </section>
  );
}
