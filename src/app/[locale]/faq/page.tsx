import { getTranslations } from 'next-intl/server';

import { FaqAccordion } from '@/components/sections/FaqAccordion';
import { Link } from '@/i18n/navigation';
import { JsonLd, SITE_ORIGIN, buildBreadcrumbList } from '@/lib/seo';

import type { SchemaOrgGraph } from '@/lib/seo';
import type { Metadata } from 'next';
import type { ReactElement } from 'react';

const FAQ_KEYS = [
  'shipping',
  'returns',
  'engraving',
  'edition',
  'repair',
  'sizing',
  'duties',
  'materials',
  'support',
] as const;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('faq');
  return {
    title: t('meta_title'),
    description: t('meta_description'),
    alternates: { canonical: '/faq' },
  };
}

async function buildFaqSchema(): Promise<SchemaOrgGraph> {
  const t = await getTranslations('faq');
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${SITE_ORIGIN}/faq#faq`,
    mainEntity: FAQ_KEYS.map((key) => ({
      '@type': 'Question',
      name: t(`items.${key}.q`),
      acceptedAnswer: {
        '@type': 'Answer',
        text: t(`items.${key}.a`),
      },
    })),
  };
}

export default async function FaqPage(): Promise<ReactElement> {
  const t = await getTranslations('faq');
  const faqSchema = await buildFaqSchema();
  return (
    <main className="bg-[var(--color-paper)] text-[var(--color-ink)]">
      <header className="border-b border-[rgba(11,15,14,0.10)] px-5 pb-16 pt-[140px] md:px-10 md:pt-[180px]">
        <div className="mx-auto grid max-w-[1180px] gap-12 md:grid-cols-[1fr_1.2fr] md:items-end md:gap-20">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-signal">
              {t('eyebrow').toUpperCase()}
            </span>
            <h1 className="mt-4 font-display text-[clamp(48px,7vw,96px)] font-bold leading-[0.92] tracking-[-0.03em]">
              {t('title')}
            </h1>
          </div>
          <p className="max-w-[56ch] text-[17px] leading-[1.6] text-[var(--color-ink)]/85">
            {t('lede')}
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-[1180px] px-5 pb-24 pt-16 md:px-10 md:pb-32 md:pt-20">
        <FaqAccordion />
      </section>

      <aside className="border-t border-[rgba(11,15,14,0.10)] bg-[rgba(11,15,14,0.04)] px-5 py-16 md:px-10 md:py-24">
        <div className="mx-auto grid max-w-[1180px] gap-10 md:grid-cols-[1fr_auto] md:items-center md:gap-20">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-signal">
              {t('contact_eyebrow').toUpperCase()}
            </span>
            <h2 className="mt-3 font-display text-[clamp(28px,4vw,40px)] font-medium leading-[1.1] tracking-[-0.015em]">
              {t('contact_title')}
            </h2>
            <p className="mt-4 max-w-[52ch] text-[15px] leading-[1.6] text-[var(--color-ink)]/85">
              {t('contact_body')}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/faq#" className="hidden" aria-hidden="true" tabIndex={-1}>
              .
            </Link>
            <a
              href="mailto:desk@manifest.office"
              className="flex h-[48px] items-center justify-center rounded-[4px] bg-[var(--color-ink)] px-6 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-paper)] transition-[background-color,letter-spacing] duration-[280ms] hover:bg-[var(--color-signal)] hover:tracking-[0.18em]"
            >
              {t('contact_email_cta')}
            </a>
            <Link
              href="/collections/edition-01"
              className="flex h-[48px] items-center justify-center rounded-[4px] border border-[var(--color-rule-strong)] px-6 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-ink)] transition-colors hover:border-[var(--color-ink)] hover:text-signal"
            >
              {t('contact_browse_cta')}
            </Link>
          </div>
        </div>
      </aside>

      <JsonLd id="faq-jsonld" schema={faqSchema} />
      <JsonLd
        id="faq-breadcrumb-jsonld"
        schema={buildBreadcrumbList([
          { name: 'Manifest Office', url: '/' },
          { name: t('title'), url: '/faq' },
        ])}
      />
    </main>
  );
}
