// `BreadcrumbList` builder. Pages pass an ordered array of crumbs (name + url).
// Relative URLs are resolved against `SITE_ORIGIN` so callers can pass either
// `/collections/edition-01` or the full canonical URL.

import { SITE_ORIGIN } from '../constants';

import type { BreadcrumbItem, SchemaOrgGraph } from '../types';

function toAbsoluteUrl(input: string): string {
  if (input.startsWith('http://') || input.startsWith('https://')) {
    return input;
  }
  if (input.startsWith('/')) {
    return `${SITE_ORIGIN}${input}`;
  }
  return `${SITE_ORIGIN}/${input}`;
}

export function buildBreadcrumbList(items: ReadonlyArray<BreadcrumbItem>): SchemaOrgGraph {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: toAbsoluteUrl(item.url),
    })),
  };
}
