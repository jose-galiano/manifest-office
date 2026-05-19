import { getTranslations } from 'next-intl/server';

import { Eyebrow } from '@/components/ui/Eyebrow';
import { Link } from '@/i18n/navigation';

import type { ReactElement } from 'react';

export async function DeskTeaser(): Promise<ReactElement> {
  const t = await getTranslations('desk_teaser');
  return (
    <section
      data-surface="ink"
      className="border-t border-[rgba(242,239,232,0.18)] bg-[#0B0F0E] px-5 md:px-10 py-20 md:py-[160px] text-[#F2EFE8]"
    >
      <div className="mx-auto max-w-[1100px] text-center">
        <Eyebrow className="mb-6 block">{t('eyebrow').toUpperCase()}</Eyebrow>
        <h2 className="mb-8 font-display font-bold leading-[0.95] tracking-[-0.02em] text-[clamp(56px,8vw,120px)]">
          {t('title')}
        </h2>
        <p className="mx-auto mb-12 max-w-[56ch] text-[18px] leading-[1.55] text-[#F2EFE8]/85">
          {t('body')}
        </p>
        <Link
          href="/products/tech-pouch-m#desk"
          className="inline-block bg-[#A8350F] px-9 py-5 font-mono text-[13px] tracking-[0.12em] uppercase transition-all duration-300 hover:bg-[#B83C16] hover:tracking-[0.18em]"
        >
          ↗ {t('cta')}
        </Link>
      </div>
    </section>
  );
}
