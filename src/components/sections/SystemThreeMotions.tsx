import Image from 'next/image';

import { Eyebrow } from '@/components/ui/Eyebrow';

import type { ReactElement } from 'react';

// "Three motions: Engage / Lock / Release" for /pages/system.

interface Motion {
  readonly number: string;
  readonly title: string;
  readonly image: string;
  readonly imageAlt: string;
  readonly copy: string;
}

const MOTIONS: readonly Motion[] = [
  {
    number: '01',
    title: 'Engage.',
    image: '/images/mood-board/v2/latch-step-01-engage.webp',
    imageAlt: 'Two halves of the Anchor Latch approaching alignment as the N52 magnet engages',
    copy: 'The magnet pulls the anchor plate into alignment. The hook geometry meshes inside a 0.8mm tolerance. You feel the click before you see it.',
  },
  {
    number: '02',
    title: 'Lock.',
    image: '/images/mood-board/v2/latch-step-02-lock.webp',
    imageAlt: 'Thumb pressing the signal-orange lever down past the hook into the locked position',
    copy: 'The signal-orange lever swings down past the hook. The magnet now serves as alignment, not retention. Vibration cannot release the kit.',
  },
  {
    number: '03',
    title: 'Release.',
    image: '/images/mood-board/v2/latch-step-03-release.webp',
    imageAlt: 'Thumb lifting the lever as the two halves of the Anchor Latch separate',
    copy: 'One thumb on the lever. The hook clears. The magnet repels. The components separate in under three seconds. Repeatable twenty-five thousand times.',
  },
];

export function SystemThreeMotions(): ReactElement {
  return (
    <section
      data-surface="ink"
      className="border-t border-[rgba(242,239,232,0.18)] bg-[#0B0F0E] px-5 md:px-10 py-20 md:py-[140px] text-[#F2EFE8]"
    >
      <div className="mx-auto max-w-[1400px]">
        <Eyebrow className="mb-6 block" flanked>
          HOW IT HOLDS
        </Eyebrow>
        <h2 className="mb-20 font-display font-bold leading-[0.95] tracking-[-0.02em] text-[clamp(40px,5vw,72px)]">
          Three motions.
        </h2>
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          {MOTIONS.map((motion) => (
            <div key={motion.number} className="group flex flex-col gap-6">
              <div className="aspect-square overflow-hidden bg-[#F2EFE8]">
                <Image
                  src={motion.image}
                  alt={motion.imageAlt}
                  width={1200}
                  height={1200}
                  className="h-full w-full object-cover transition-transform duration-[1500ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
                />
              </div>
              <div className="font-display font-bold leading-[0.9] tracking-[-0.03em] text-[96px] text-signal">
                {motion.number}
              </div>
              <div>
                <h3 className="mb-2 font-display text-[24px] font-medium tracking-[-0.01em]">
                  {motion.title}
                </h3>
                <p className="max-w-[32ch] text-[15px] leading-[1.55] text-[#F2EFE8]/80">
                  {motion.copy}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
