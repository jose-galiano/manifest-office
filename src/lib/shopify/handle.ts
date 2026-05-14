// Shopify-handle ↔ storefront-handle conversion.
//
// The live Shopify store uses the `manifest-` prefix on every product handle
// (a relic of multi-brand dev-store sharing). The Next.js storefront strips
// the prefix at the route boundary so URLs read clean (`/products/field-tote`
// → fetched as `manifest-field-tote`). This module is the only place that
// knows about that prefix.

const PREFIX = 'manifest-';
const PREFIX_REGEX = /^manifest-/;

export function toShopifyHandle(storefrontHandle: string): string {
  if (PREFIX_REGEX.test(storefrontHandle)) {
    return storefrontHandle;
  }
  return `${PREFIX}${storefrontHandle}`;
}

export function toStorefrontHandle(shopifyHandle: string): string {
  return shopifyHandle.replace(PREFIX_REGEX, '');
}
