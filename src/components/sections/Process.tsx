import { Eyebrow } from '@/components/ui/Eyebrow';

import type { ReactElement } from 'react';

// Three-step "Specified / Made / Issued" process block. Replaces the legacy
// "Kit Preview" 6-card grid on the homepage — that grid now lives on the
// /collections/edition-01 page (Agent D). The homepage describes the
// production process instead, which maps to the brand voice:
//   Specified by Office  → Designed and engineered in Valencia.
//   Made at Atelier      → Cut, stitched, inspected at Atelier Souto, Porto.
//   Issued from Porto    → Shipped with the printed dossier and an Edition number.

const STEPS: readonly { number: string; title: string; copy: string }[] = [
  {
    number: '01',
    title: 'Specified.',
    copy: 'Every dossier ships with a printed spec sheet — fabric weight, stitch count, hardware tolerance. No undocumented choices. No proprietary screws.',
  },
  {
    number: '02',
    title: 'Made.',
    copy: 'Cut, stitched, and twice-inspected by a fourteen-person atelier forty kilometres north of Porto. Ten units a day. Six days a week.',
  },
  {
    number: '03',
    title: 'Issued.',
    copy: 'Numbered, registered, and shipped from Porto in five business days. When the allocation closes, the Edition closes. We do not restock.',
  },
];

export function Process(): ReactElement {
  return (
    <section className="border-t border-[rgba(11,15,14,0.12)] bg-[#F2EFE8] px-5 md:px-10 py-20 md:py-[160px] text-[#0B0F0E]">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-20 grid grid-cols-1 items-end gap-16 md:grid-cols-2">
          <div>
            <Eyebrow className="mb-4 block">— THE PROCESS —</Eyebrow>
            <h2 className="font-display font-bold leading-[0.95] tracking-[-0.02em] text-[clamp(48px,6vw,88px)]">
              Three motions. <br />
              Office to operator.
            </h2>
          </div>
          <p className="max-w-[48ch] text-[17px] leading-[1.55]">
            We do not subcontract the bag and outsource the story. The system is specified by the
            office, made in a named atelier, and issued in a finite allocation. No middle layer.
          </p>
        </div>

        {/* Mobile: horizontal scroll-cards so the user swipes through the
            three motions rather than scrolling past a vertical stack. Desktop
            (>= md) reverts to a static 3-column grid. */}
        <div className="md:hidden -mx-5">
          <div className="flex gap-5 overflow-x-auto overflow-y-hidden snap-x snap-mandatory no-scrollbar px-5 pb-4">
            {STEPS.map((step) => (
              <article
                key={step.number}
                className="flex w-[280px] shrink-0 snap-start flex-col gap-5 border-l-2 border-[#D24A1F] pl-5"
              >
                <div className="font-display font-bold leading-[0.9] tracking-[-0.03em] text-[80px] text-signal">
                  {step.number}
                </div>
                <div>
                  <h3 className="mb-2 font-display text-[26px] font-medium leading-[1] tracking-[-0.01em]">
                    {step.title}
                  </h3>
                  <p className="text-[15px] leading-[1.55] text-[#0B0F0E]/80">{step.copy}</p>
                </div>
              </article>
            ))}
          </div>
          <style>{`
            .no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
            .no-scrollbar::-webkit-scrollbar { display: none; }
          `}</style>
        </div>

        <div className="hidden md:grid md:grid-cols-3 gap-12">
          {STEPS.map((step) => (
            <div key={step.number} className="flex flex-col gap-6">
              <div className="font-display font-bold leading-[0.9] tracking-[-0.03em] text-[96px] text-signal">
                {step.number}
              </div>
              <div>
                <h3 className="mb-2 font-display text-[28px] font-medium leading-[1] tracking-[-0.01em]">
                  {step.title}
                </h3>
                <p className="max-w-[32ch] text-[15px] leading-[1.55] text-[#0B0F0E]/80">
                  {step.copy}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
