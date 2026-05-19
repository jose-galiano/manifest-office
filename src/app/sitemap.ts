// Native Next.js `sitemap.ts` convention (App Router, Next 15). Emits
// `/sitemap.xml` from a typed array. Every URL is repeated per locale and
// declares its `alternates.languages` map + `x-default` so search engines
// pick the right page per visitor and never index a non-canonical variant.
//
// Lastmod is build-time today; promote to per-resource timestamps once a
// CMS / database is added.

import { COLLECTIONS, EDITION_01_PRODUCTS, STATIC_PAGES } from '@/content/manifest-office';
import { routing } from '@/i18n/routing';
import { SITE_ORIGIN } from '@/lib/seo';

import type { MetadataRoute } from 'next';

const BLOG_HANDLES = ['operator-notes'] as const;
const DEFAULT_LOCALE = routing.defaultLocale;
const LOCALES = routing.locales;

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;

type RouteSpec = {
  readonly path: string;
  readonly priority: number;
  readonly changeFrequency: ChangeFrequency;
};

function makeAlternates(path: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of LOCALES) {
    languages[locale] = `${SITE_ORIGIN}/${locale}${path}`;
  }
  languages['x-default'] = `${SITE_ORIGIN}/${DEFAULT_LOCALE}${path}`;
  return languages;
}

function expandRoute(spec: RouteSpec, lastModified: Date): MetadataRoute.Sitemap {
  const languages = makeAlternates(spec.path);
  return LOCALES.map((locale) => ({
    url: `${SITE_ORIGIN}/${locale}${spec.path}`,
    lastModified,
    changeFrequency: spec.changeFrequency,
    priority: spec.priority,
    alternates: { languages },
  }));
}

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const specs: RouteSpec[] = [{ path: '', priority: 1.0, changeFrequency: 'daily' }];

  for (const collection of COLLECTIONS) {
    specs.push({
      path: `/collections/${collection.handle}`,
      priority: 0.8,
      changeFrequency: 'weekly',
    });
  }
  for (const product of EDITION_01_PRODUCTS) {
    specs.push({
      path: `/products/${product.handle}`,
      priority: 0.9,
      changeFrequency: 'weekly',
    });
  }
  for (const page of STATIC_PAGES) {
    specs.push({
      path: `/pages/${page.handle}`,
      priority: 0.5,
      changeFrequency: 'monthly',
    });
  }
  for (const blog of BLOG_HANDLES) {
    specs.push({ path: `/blogs/${blog}`, priority: 0.4, changeFrequency: 'weekly' });
  }

  return specs.flatMap((spec) => expandRoute(spec, lastModified));
}
