// schema.org `WebSite` node. Declares the canonical site origin and the
// `SearchAction` template so search engines (and agentic crawlers) know the
// query shape. `/search` is reserved per `docs/routing.md` — declaring it now
// keeps the contract stable when the page lands.

import { BRAND_DESCRIPTION, BRAND_NAME, SITE_ORIGIN } from '../constants';

import type { SchemaOrgGraph } from '../types';

export function buildWebsiteSchema(): SchemaOrgGraph {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_ORIGIN}/#website`,
    url: SITE_ORIGIN,
    name: BRAND_NAME,
    description: BRAND_DESCRIPTION,
    publisher: { '@id': `${SITE_ORIGIN}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_ORIGIN}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}
