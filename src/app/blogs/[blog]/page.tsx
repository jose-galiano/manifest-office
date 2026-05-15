import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Eyebrow } from '@/components/ui/Eyebrow';
import { MonoCaption } from '@/components/ui/MonoCaption';
import { JsonLd, SITE_ORIGIN, buildBreadcrumbList } from '@/lib/seo';

import type { SchemaOrgGraph } from '@/lib/seo';
import type { Metadata } from 'next';
import type { ReactElement } from 'react';

// `/blogs/:blog` — blog index. Canonical Shopify routes.blog_url shape.
// Only `operator-notes` is reserved today (docs/routing.md). No real
// articles yet — render an empty-state with a mono caption.

const BLOG_HANDLES = ['operator-notes'] as const;
type BlogHandle = (typeof BLOG_HANDLES)[number];
const BLOG_HANDLE_SET: ReadonlySet<string> = new Set(BLOG_HANDLES);

interface BlogMeta {
  readonly title: string;
  readonly description: string;
  readonly captionTitle: string;
}

const BLOG_META: Record<BlogHandle, BlogMeta> = {
  'operator-notes': {
    title: 'Operator Notes',
    description:
      'Field notes from operators carrying the Edition 01 kit. No entries yet — the first dispatch lands when Edition 01 ships.',
    captionTitle: 'OPERATOR NOTES · NO ENTRIES',
  },
};

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
  if (!isBlogHandle(blog)) {
    return {};
  }
  const meta = BLOG_META[blog];
  return { title: meta.title, description: meta.description };
}

function buildBlogSchema(handle: BlogHandle, meta: BlogMeta): SchemaOrgGraph {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    '@id': `${SITE_ORIGIN}/blogs/${handle}#blog`,
    name: meta.title,
    description: meta.description,
    url: `${SITE_ORIGIN}/blogs/${handle}`,
    publisher: { '@id': `${SITE_ORIGIN}/#organization` },
    inLanguage: 'en',
  };
}

export default async function BlogIndexPage({ params }: BlogPageProps): Promise<ReactElement> {
  const { blog } = await params;
  if (!isBlogHandle(blog)) {
    notFound();
  }
  const meta = BLOG_META[blog];
  return (
    <main className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center bg-[#F2EFE8] px-5 md:px-10 py-32 text-[#0B0F0E]">
      <div className="max-w-xl text-center">
        <Eyebrow className="mb-6 block" flanked>
          THE BLOG
        </Eyebrow>
        <h1 className="mb-8 font-display font-bold leading-[0.95] tracking-[-0.02em] text-[clamp(40px,5vw,72px)]">
          {meta.title}
        </h1>
        <MonoCaption tone="lichen" className="mb-12 block tracking-[0.12em]">
          {meta.captionTitle}
        </MonoCaption>
        <p className="mx-auto mb-12 max-w-[44ch] text-[17px] leading-[1.7] text-[#0B0F0E]/75">
          {meta.description}
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 bg-[#0B0F0E] px-6 py-3.5 font-mono text-[11px] tracking-[0.12em] uppercase text-[#F2EFE8] transition-all duration-300 hover:bg-[#D24A1F] hover:tracking-[0.16em]"
        >
          Return to the office <span aria-hidden="true">→</span>
        </Link>
      </div>

      <JsonLd id="blog-jsonld" schema={buildBlogSchema(blog, meta)} />
      <JsonLd
        id="blog-breadcrumb-jsonld"
        schema={buildBreadcrumbList([
          { name: 'Manifest Office', url: '/' },
          { name: 'Blogs', url: '/blogs/operator-notes' },
          { name: meta.title, url: `/blogs/${blog}` },
        ])}
      />
    </main>
  );
}
