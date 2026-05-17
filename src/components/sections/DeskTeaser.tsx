import Link from 'next/link';

import { Eyebrow } from '@/components/ui/Eyebrow';

import type { ReactElement } from 'react';

// "Brief the desk" CTA block — links to the PDP page where the desk dialog
// actually lives (`/products/tech-pouch-m#desk`). The CTA on the
// homepage navigates; the desk component itself is owned by Agent A / D
// inside the PDP route.

export function DeskTeaser(): ReactElement {
  return (
    <section
      data-surface="ink"
      className="border-t border-[rgba(242,239,232,0.18)] bg-[#0B0F0E] px-5 md:px-10 py-20 md:py-[160px] text-[#F2EFE8]"
    >
      <div className="mx-auto max-w-[1100px] text-center">
        <Eyebrow className="mb-6 block">THE DESK · BETA</Eyebrow>
        <h2 className="mb-8 font-display font-bold leading-[0.95] tracking-[-0.02em] text-[clamp(56px,8vw,120px)]">
          Tell us the trip.
          <br />
          The desk responds.
        </h2>
        <p className="mx-auto mb-12 max-w-[56ch] text-[18px] leading-[1.55] text-[#F2EFE8]/85">
          Describe a trip in plain language. The desk returns a recommended allocation, a printable
          manifest, and a checklist you can save to your calendar. Built on Claude. Trained on
          Edition 01 use patterns. No chat. No bot. A desk.
        </p>
        <Link
          href="/products/tech-pouch-m#desk"
          className="inline-block bg-[#D24A1F] px-9 py-5 font-mono text-[13px] tracking-[0.12em] uppercase transition-all duration-300 hover:bg-[#B83C16] hover:tracking-[0.18em]"
        >
          ↗ Brief the desk
        </Link>
      </div>
    </section>
  );
}
