import Image from 'next/image';
import { getTranslations } from 'next-intl/server';

import { Eyebrow } from '@/components/ui/Eyebrow';

import type { ReactElement } from 'react';

type MetaKey = 'anchor' | 'accent' | 'guest' | 'allocation' | 'issued';
const META_KEYS: readonly MetaKey[] = ['anchor', 'accent', 'guest', 'allocation', 'issued'];

export async function EditionFeature(): Promise<ReactElement> {
  const t = await getTranslations('edition_feature');
  return (
    <section
      data-surface="ink"
      className="border-t border-[rgba(242,239,232,0.18)] bg-[#0B0F0E] px-5 md:px-10 py-20 md:py-[160px] text-[#F2EFE8]"
    >
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-20 md:grid-cols-2">
        <div className="aspect-[3/4] overflow-hidden">
          <Image
            src="/images/mood-board/editorial/edition-folio.webp"
            alt={t('image_alt')}
            width={900}
            height={1200}
            className="h-full w-full object-cover transition-transform duration-[1500ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.05]"
            priority={false}
          />
        </div>
        <div>
          <Eyebrow className="mb-6 block">{t('eyebrow').toUpperCase()}</Eyebrow>
          <h2 className="mb-8 font-display font-bold leading-[0.95] tracking-[-0.02em] text-[clamp(56px,7vw,96px)]">
            {t('title_line_1')}
            <br />
            {t('title_line_2')}
          </h2>
          <p className="mb-6 max-w-[48ch] text-[18px] leading-[1.55] text-[#F2EFE8]/85">
            {t('body_1')}
          </p>
          <p className="mb-6 max-w-[48ch] text-[18px] leading-[1.55] text-[#F2EFE8]/85">
            {t('body_2')}
          </p>
          <dl className="mt-12 grid grid-cols-[140px_1fr] gap-x-8 gap-y-3 border-t border-[rgba(242,239,232,0.18)] pt-8 font-mono text-[12px] tracking-[0.04em] uppercase">
            {META_KEYS.map((key) => (
              <div key={key} className="contents">
                <dt className="text-[#9CAA98]">{t(`meta_${key}_term`)}</dt>
                <dd className="text-[#F2EFE8]">{t(`meta_${key}_def`)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
