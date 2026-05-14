// Shopify-specific constants. API version + metafield namespace live here so
// a Shopify version bump touches one file.

export const SHOPIFY_API_VERSION = '2025-10';
export const SHOPIFY_METAFIELD_NAMESPACE = 'manifest';

export const SHOPIFY_METAFIELD_KEYS = {
  volume: 'volume',
  allocationTotal: 'allocation_total',
  allocationIssued: 'allocation_issued',
  edition: 'edition',
  skuRef: 'sku_ref',
} as const;
