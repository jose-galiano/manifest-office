import Image from 'next/image';
import Link from 'next/link';

import { Eyebrow } from '@/components/ui/Eyebrow';

import type { ReactElement } from 'react';

// Closing dossier-list block for /pages/system — "The latch is the connector."

export function SystemEcosystem(): ReactElement {
  return (
    <section className="border-t border-[rgba(11,15,14,0.12)] bg-[#F2EFE8] px-5 md:px-10 py-20 md:py-[140px]">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-16 grid grid-cols-1 items-end gap-20 md:grid-cols-2">
          <div>
            <Eyebrow className="mb-6 block" flanked>
              THE FAMILY
            </Eyebrow>
            <h2 className="font-display font-bold leading-[0.95] tracking-[-0.02em] text-[clamp(40px,5vw,72px)]">
              The latch is the connector.
              <br />
              The kit is the architecture.
            </h2>
          </div>
          <p className="max-w-[44ch] text-[17px] leading-[1.55]">
            Every Dossier in Edition 01 carries the Anchor Latch in the same orientation, same
            dimensions, same mounting points. A cube from Edition 03 will lock to a tote from
            Edition 01. The system survives the brand.
          </p>
        </div>
        <div className="mt-12 aspect-[16/9] overflow-hidden">
          <Image
            src="/images/mood-board/v1/12-full-system-flatlay.webp"
            alt="The full Manifest Office system"
            width={1920}
            height={1080}
            className="h-full w-full object-cover"
          />
        </div>
        <Link
          href="/collections/edition-01"
          className="mt-12 inline-flex items-center gap-2.5 bg-[#0B0F0E] px-7 py-4 font-mono text-[12px] tracking-[0.12em] uppercase text-[#F2EFE8] transition-all duration-300 hover:bg-[#D24A1F] hover:tracking-[0.16em]"
        >
          Open the Dossiers <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
