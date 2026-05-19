import { getTranslations } from 'next-intl/server';

import { COLLECTIONS } from '@/content/manifest-office';
import { Link } from '@/i18n/navigation';

import type { Metadata } from 'next';
import type { ReactElement } from 'react';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('collections_index');
  return { title: t('title_meta'), description: t('description_meta') };
}

export default async function CollectionsIndexPage(): Promise<ReactElement> {
  const t = await getTranslations('collections_index');
  const tCollection = await getTranslations('collection');
  return (
    <main className="min-h-screen bg-[#F2EFE8] text-[#0B0F0E]">
      <header className="border-b border-[rgba(11,15,14,0.12)] px-5 md:px-10 pb-12 pt-[110px] md:pt-[140px]">
        <div className="mx-auto max-w-[1600px]">
          <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.06em] text-[#5C6B5A]">
            {t('eyebrow').toUpperCase()}
          </div>
          <h1 className="font-display text-[clamp(56px,8vw,120px)] font-bold leading-[0.92] tracking-[-0.03em]">
            {t('title')}
          </h1>
          <p className="mt-6 max-w-[64ch] font-mono text-[12px] uppercase leading-[1.6] tracking-[0.06em] text-[#5C6B5A]">
            {t('lede')}
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-[1600px] divide-y divide-[rgba(11,15,14,0.12)]">
        {COLLECTIONS.map((collection) => (
          <Link
            key={collection.handle}
            href={`/collections/${collection.handle}`}
            className="group flex flex-col gap-3 px-5 md:px-10 py-10 transition-colors duration-300 hover:bg-[rgba(11,15,14,0.03)] md:flex-row md:items-baseline md:justify-between md:gap-12"
            data-cursor
          >
            <div className="flex-1">
              <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#5C6B5A]">
                {tCollection('count', { count: collection.productHandles.length }).toUpperCase()}
              </div>
              <h2 className="mt-3 font-display text-[clamp(36px,5vw,64px)] font-bold leading-[0.95] tracking-[-0.02em] transition-colors duration-300 group-hover:text-signal">
                {collection.title}
              </h2>
            </div>
            <p className="max-w-[56ch] font-body text-[15px] leading-[1.55] text-[#0B0F0E]/85 md:text-right">
              {collection.summary}
            </p>
          </Link>
        ))}
      </section>
    </main>
  );
}
