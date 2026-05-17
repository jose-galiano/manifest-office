import { Eyebrow } from '@/components/ui/Eyebrow';

import type { ReactElement } from 'react';

export function EditionsPhilosophy(): ReactElement {
  return (
    <section
      data-surface="ink"
      className="border-t border-[rgba(242,239,232,0.18)] bg-[#0B0F0E] px-5 md:px-10 py-20 md:py-[160px] text-[#F2EFE8]"
    >
      <div className="mx-auto max-w-[1000px] text-center">
        <Eyebrow className="mb-6 block" flanked>
          A NOTE ON FINITUDE
        </Eyebrow>
        <h2 className="mb-12 font-display font-bold leading-[0.95] tracking-[-0.02em] text-[clamp(48px,6vw,88px)]">
          The Edition is the unit.
        </h2>
        <p className="mx-auto mb-6 max-w-[54ch] text-[19px] leading-[1.7] text-[#F2EFE8]/85">
          A normal brand stocks. A normal brand restocks. A normal brand is a continuous line. We
          are not a continuous line. We are a sequence of bounded projects. Edition 01 is a complete
          thought. Edition 02 is a different one. The space between them is not a gap. It is the
          architecture.
        </p>
        <p className="mx-auto max-w-[54ch] text-[19px] leading-[1.7] text-[#F2EFE8]/85">
          You can buy from the Edition that is open. You cannot buy from the Edition that is closed.
          That is the entire policy.
        </p>
      </div>
    </section>
  );
}
