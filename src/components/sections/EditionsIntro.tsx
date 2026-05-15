import Image from 'next/image';

import { Eyebrow } from '@/components/ui/Eyebrow';

import type { ReactElement } from 'react';

export function EditionsIntro(): ReactElement {
  return (
    <section className="border-t border-[rgba(11,15,14,0.12)] bg-[#F2EFE8] px-5 md:px-10 py-20 md:py-[140px]">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-20 md:grid-cols-2">
        <div className="group aspect-[3/4] overflow-hidden">
          <Image
            src="/images/mood-board/v1/15-edition-chipboard-certificate.webp"
            alt="Edition certificates"
            width={900}
            height={1200}
            className="h-full w-full object-cover transition-transform duration-[1800ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
          />
        </div>
        <div>
          <Eyebrow className="mb-6 block" flanked>
            WHAT WE MEAN BY EDITION
          </Eyebrow>
          <h2 className="mb-8 font-display font-bold leading-[0.95] tracking-[-0.02em] text-[clamp(40px,5vw,64px)]">
            A place,
            <br />
            a material,
            <br />
            twelve hundred systems.
          </h2>
          <p className="mb-4 max-w-[48ch] text-[18px] leading-[1.6]">
            Every Edition anchors to one geographic point on the map. Every Edition introduces a
            single guest material that will not appear again. Every Edition is capped at twelve
            hundred systems. When the allocation closes, that Edition is documented and archived.
          </p>
          <p className="max-w-[48ch] text-[18px] leading-[1.6]">
            We do not restock. We do not re-issue. The next Edition is a different place, a
            different material, the same architecture.
          </p>
        </div>
      </div>
    </section>
  );
}
