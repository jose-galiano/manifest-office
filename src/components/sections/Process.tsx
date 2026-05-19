import { getTranslations } from 'next-intl/server';

import { Eyebrow } from '@/components/ui/Eyebrow';

import type { ReactElement } from 'react';

// Three-step "Specified / Made / Issued" process block. Replaces the legacy
// "Kit Preview" 6-card grid on the homepage — that grid now lives on the
// /collections/edition-01 page (Agent D). The homepage describes the
// production process instead, which maps to the brand voice:
//   Specified by Office  → Designed and engineered in Valencia.
//   Made at Atelier      → Cut, stitched, inspected at Atelier Souto, Porto.
//   Issued from Porto    → Shipped with the printed dossier and an Edition number.

type StepKey = '01' | '02' | '03';
const STEP_KEYS: readonly StepKey[] = ['01', '02', '03'];

export async function Process(): Promise<ReactElement> {
  const t = await getTranslations('process');
  const steps = STEP_KEYS.map((number) => ({
    number,
    title: t(`step_${number}_title`),
    copy: t(`step_${number}_copy`),
  }));
  return (
    <section className="border-t border-[rgba(11,15,14,0.12)] bg-[#F2EFE8] px-5 md:px-10 py-20 md:py-[160px] text-[#0B0F0E]">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-20 grid grid-cols-1 items-end gap-16 md:grid-cols-2">
          <div>
            <Eyebrow className="mb-4 block">— {t('eyebrow').toUpperCase()} —</Eyebrow>
            <h2 className="font-display font-bold leading-[0.95] tracking-[-0.02em] text-[clamp(48px,6vw,88px)]">
              {t('title_line_1')} <br />
              {t('title_line_2')}
            </h2>
          </div>
          <p className="max-w-[48ch] text-[17px] leading-[1.55]">{t('lede')}</p>
        </div>

        {/* Mobile: horizontal scroll-cards so the user swipes through the
            three motions rather than scrolling past a vertical stack. Desktop
            (>= md) reverts to a static 3-column grid. */}
        <div className="md:hidden -mx-5">
          <div className="flex gap-5 overflow-x-auto overflow-y-hidden snap-x snap-mandatory no-scrollbar px-5 pb-4">
            {steps.map((step) => (
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
          {steps.map((step) => (
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
