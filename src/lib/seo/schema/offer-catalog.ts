// `OfferCatalog` builder for collection pages. Wraps every `Product` in the
// collection as an `Offer` so agentic crawlers can ingest the whole
// collection from one URL without follow-up requests per SKU.

import { findProductByShopifyHandle } from '@/content/manifest-office';

import { SITE_ORIGIN } from '../constants';

import { buildProductSchema } from './product';

import type { SchemaOrgGraph } from '../types';
import type { Collection } from '@/content/manifest-office';
import type { ManifestProduct } from '@/lib/types/product';

export function buildOfferCatalog(
  collection: Collection,
  products: ReadonlyArray<ManifestProduct>,
): SchemaOrgGraph {
  const url = `${SITE_ORIGIN}/collections/${collection.handle}`;
  // Filter to products that actually belong to this collection. The page
  // handler already does this, but the builder must be self-consistent if
  // someone calls it with the full feed.
  const inCollection = products.filter((product) => {
    const entry = findProductByShopifyHandle(product.handle);
    return entry ? collection.productHandles.includes(entry.handle) : false;
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'OfferCatalog',
    '@id': `${url}#catalog`,
    name: collection.title,
    description: collection.summary,
    url,
    numberOfItems: inCollection.length,
    itemListElement: inCollection.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: buildProductSchema(product),
    })),
  };
}
