import { Eyebrow } from '@/components/ui/Eyebrow';

import type { ReactElement } from 'react';

export function EditionsHero(): ReactElement {
  return (
    <section className="bg-[#0B0F0E] px-5 md:px-10 pt-[110px] md:pt-[160px] pb-16 md:pb-[120px] text-[#F2EFE8]">
      <div className="mx-auto max-w-[1400px]">
        <Eyebrow className="mb-8 block" flanked>
          ARCHIVE / 03 EDITIONS DOCUMENTED
        </Eyebrow>
        <h1 className="mb-12 font-display font-bold leading-[0.88] tracking-[-0.035em] text-[clamp(72px,13vw,200px)]">
          Editions.
        </h1>
        <p className="max-w-[32ch] font-display text-[clamp(22px,2.4vw,32px)] font-normal leading-[1.25] text-[#F2EFE8]/85">
          A finite allocation of a single thought. When it closes, it stays closed.
        </p>
      </div>
    </section>
  );
}
