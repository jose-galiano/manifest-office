import Link from 'next/link';

import { Eyebrow } from '@/components/ui/Eyebrow';

import type { ReactElement } from 'react';

// "Repair, not replace" promise block for /pages/provenance.
// Replaces the legacy materials + QC blocks with a single, clearer commitment.

export function RepairPromise(): ReactElement {
  return (
    <section className="border-t border-[rgba(11,15,14,0.12)] bg-[#F2EFE8] px-5 md:px-10 py-20 md:py-[160px]">
      <div className="mx-auto max-w-[1000px] text-center">
        <Eyebrow className="mb-6 block" flanked>
          THE PROMISE
        </Eyebrow>
        <h2 className="mb-12 font-display font-bold leading-[0.95] tracking-[-0.02em] text-[clamp(48px,6vw,88px)]">
          Repair, not replace.
          <br />
          For the lifetime of the kit.
        </h2>
        <p className="mx-auto mb-6 max-w-[56ch] text-[18px] leading-[1.7]">
          Every Dossier is built from six or fewer machined, stamped, or stitched components. There
          are no moulded plastics, no proprietary screws, no glued seams that cannot be unpicked.
          When a zip wears out, we send a new zip. When the magnet weakens after twenty years, we
          send a new magnet. The kit is built to be opened.
        </p>
        <p className="mx-auto mb-12 max-w-[56ch] text-[18px] leading-[1.7]">
          Send a photograph and your edition number. The atelier responds in five business days with
          a repair window or a part on its way.
        </p>
        <Link
          href="mailto:repair@manifestoffice.com"
          className="inline-flex items-center gap-2.5 bg-[#0B0F0E] px-7 py-4 font-mono text-[12px] tracking-[0.12em] uppercase text-[#F2EFE8] transition-all duration-300 hover:bg-[#D24A1F] hover:tracking-[0.16em]"
        >
          Open a repair ticket <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
