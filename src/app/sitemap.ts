// Native Next.js `sitemap.ts` convention (App Router, Next 15). Emits
// `/sitemap.xml` from a typed array. Lastmod is build-time today; promote to
// per-resource timestamps once a CMS / database is added.
//
// Priorities follow Google's "guidance only" semantics — they signal relative
// importance within the site, not absolute crawl frequency.

import { COLLECTIONS, EDITION_01_PRODUCTS, STATIC_PAGES } from '@/content/manifest-office';
import { SITE_ORIGIN } from '@/lib/seo';

import type { MetadataRoute } from 'next';

const BLOG_HANDLES = ['operator-notes'] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const entries: MetadataRoute.Sitemap = [
    {
      url: `${SITE_ORIGIN}/`,
      lastModified,
      changeFrequency: 'daily',
      priority: 1.0,
    },
  ];

  for (const collection of COLLECTIONS) {
    entries.push({
      url: `${SITE_ORIGIN}/collections/${collection.handle}`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  }

  for (const product of EDITION_01_PRODUCTS) {
    entries.push({
      url: `${SITE_ORIGIN}/products/${product.handle}`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    });
  }

  for (const page of STATIC_PAGES) {
    entries.push({
      url: `${SITE_ORIGIN}/pages/${page.handle}`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.5,
    });
  }

  for (const blog of BLOG_HANDLES) {
    entries.push({
      url: `${SITE_ORIGIN}/blogs/${blog}`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.4,
    });
  }

  return entries;
}
