import Image from 'next/image';

import { Eyebrow } from '@/components/ui/Eyebrow';

import type { ReactElement } from 'react';

export function ProvenanceHero(): ReactElement {
  return (
    <section className="border-b border-[rgba(11,15,14,0.12)] bg-[#F2EFE8] px-5 md:px-10 pt-[110px] md:pt-[140px] pb-14 md:pb-[100px]">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-20 md:grid-cols-2">
        <div className="min-w-0">
          <Eyebrow className="mb-8 block" flanked>
            MADE IN PORTO · DOCUMENTED IN FULL
          </Eyebrow>
          <h1 className="mb-8 break-words font-display font-bold leading-[0.9] tracking-[-0.03em] text-[clamp(48px,7vw,112px)]">
            Provenance.
          </h1>
          <p className="max-w-[32ch] font-display text-[clamp(20px,2vw,26px)] font-normal leading-[1.3] text-[#0B0F0E]/75">
            We name the factory. We name the sample-room lead. We name the supplier of the zips. The
            system has no shadow.
          </p>
        </div>
        <div className="relative aspect-[3/4] min-w-0 overflow-hidden">
          <Image
            src="/images/mood-board/v1/11-hand-fabric-detail.webp"
            alt="Cordura fabric inspection"
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
            priority
          />
        </div>
      </div>
    </section>
  );
}
