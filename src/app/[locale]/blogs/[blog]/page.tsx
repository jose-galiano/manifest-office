import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';

import { Eyebrow } from '@/components/ui/Eyebrow';
import { MonoCaption } from '@/components/ui/MonoCaption';
import { Link } from '@/i18n/navigation';
import { LOCALE_MARKET, type Locale } from '@/i18n/routing';
import { JsonLd, SITE_ORIGIN, buildBreadcrumbList } from '@/lib/seo';

import type { SchemaOrgGraph } from '@/lib/seo';
import type { Metadata } from 'next';
import type { ReactElement } from 'react';

const BLOG_HANDLES = ['operator-notes'] as const;
type BlogHandle = (typeof BLOG_HANDLES)[number];
const BLOG_HANDLE_SET: ReadonlySet<string> = new Set(BLOG_HANDLES);

function isBlogHandle(value: string): value is BlogHandle {
  return BLOG_HANDLE_SET.has(value);
}

export function generateStaticParams(): { blog: BlogHandle }[] {
  return BLOG_HANDLES.map((blog) => ({ blog }));
}

interface BlogPageProps {
  params: Promise<{ blog: string }>;
}

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { blog } = await params;
  if (!isBlogHandle(blog)) return {};
  const t = await getTranslations('blog');
  return { title: t(`${blog}.title`), description: t(`${blog}.description`) };
}

function buildBlogSchema(
  handle: BlogHandle,
  title: string,
  description: string,
  locale: Locale,
): SchemaOrgGraph {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    '@id': `${SITE_ORIGIN}/blogs/${handle}#blog`,
    name: title,
    description,
    url: `${SITE_ORIGIN}/blogs/${handle}`,
    publisher: { '@id': `${SITE_ORIGIN}/#organization` },
    inLanguage: LOCALE_MARKET[locale]?.intlLocale ?? 'en-GB',
  };
}

export default async function BlogIndexPage({ params }: BlogPageProps): Promise<ReactElement> {
  const { blog } = await params;
  if (!isBlogHandle(blog)) {
    notFound();
  }
  const t = await getTranslations('blog');
  const locale = (await getLocale()) as Locale;
  const title = t(`${blog}.title`);
  const description = t(`${blog}.description`);
  const captionTitle = t(`${blog}.caption`);
  return (
    <main className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center bg-[#F2EFE8] px-5 md:px-10 py-32 text-[#0B0F0E]">
      <div className="max-w-xl text-center">
        <Eyebrow className="mb-6 block" flanked>
          {t('eyebrow').toUpperCase()}
        </Eyebrow>
        <h1 className="mb-8 font-display font-bold leading-[0.95] tracking-[-0.02em] text-[clamp(40px,5vw,72px)]">
          {title}
        </h1>
        <MonoCaption tone="lichen" className="mb-12 block tracking-[0.12em]">
          {captionTitle.toUpperCase()}
        </MonoCaption>
        <p className="mx-auto mb-12 max-w-[44ch] text-[17px] leading-[1.7] text-[#0B0F0E]/75">
          {description}
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 bg-[#0B0F0E] px-6 py-3.5 font-mono text-[11px] tracking-[0.12em] uppercase text-[#F2EFE8] transition-all duration-300 hover:bg-[#D24A1F] hover:tracking-[0.16em]"
        >
          {t('return_cta')} <span aria-hidden="true">→</span>
        </Link>
      </div>

      <JsonLd id="blog-jsonld" schema={buildBlogSchema(blog, title, description, locale)} />
      <JsonLd
        id="blog-breadcrumb-jsonld"
        schema={buildBreadcrumbList([
          { name: 'Manifest Office', url: '/' },
          { name: t('blogs_breadcrumb'), url: '/blogs/operator-notes' },
          { name: title, url: `/blogs/${blog}` },
        ])}
      />
    </main>
  );
}
