// PLP card photography overrides.
//
// The Shopify-side imagery seeded during the bring-up was editorial flat-lay
// (busy, multi-object, varying backdrops). The retake — single product per
// card, paper-cream backdrop, soft north light, Mismo discipline — is
// generated and stored in the repo at /public/images/products/<colorway>/
// so the assets travel with the codebase. This map injects them as the
// featured image of each Shopify product node, leaving the Shopify-side
// imagery in place as the gallery tail for PDP secondary shots.
//
// Keyed by the Shopify-side handle (with the `manifest-` prefix). The
// storefront-side handle (no prefix) is what reaches the URL; the override
// is applied earlier, inside `mapNodeToProduct`, before that conversion
// happens.

export const PLP_CHARCOAL_IMAGE_OVERRIDES: Readonly<Record<string, string>> = {
  'manifest-field-tote': '/images/products/charcoal/field-tote.webp',
  'manifest-tech-pouch-s': '/images/products/charcoal/tech-pouch-s.webp',
  'manifest-tech-pouch-m': '/images/products/charcoal/tech-pouch-m.webp',
  'manifest-tech-pouch-l': '/images/products/charcoal/tech-pouch-l.webp',
  'manifest-cube-s': '/images/products/charcoal/cube-s.webp',
  'manifest-cube-m': '/images/products/charcoal/cube-m.webp',
  'manifest-cube-l': '/images/products/charcoal/cube-l.webp',
  'manifest-toiletry-kit': '/images/products/charcoal/toiletry-kit.webp',
  'manifest-luggage-tag': '/images/products/charcoal/luggage-tag.webp',
  'manifest-anchor-latch': '/images/products/charcoal/anchor-latch.webp',
};

export function resolvePlpImage(shopifyHandle: string): string | null {
  return PLP_CHARCOAL_IMAGE_OVERRIDES[shopifyHandle] ?? null;
}

// Synthetic colorway extensions for hardware SKUs. The Shopify-side
// products don't carry a colorway option (the soft goods do), so this map
// injects the alt finish at the data layer + provides the image URL the
// PLP card swap reads. Keys are Shopify-side handles.
export type SyntheticColorway = {
  readonly name: string;
  readonly hex: string;
  readonly imageUrl: string;
};

export const SYNTHETIC_COLORWAYS: Readonly<Record<string, readonly SyntheticColorway[]>> = {
  'manifest-luggage-tag': [
    { name: 'Charcoal', hex: '#1A1A1A', imageUrl: '/images/products/charcoal/luggage-tag.webp' },
    { name: 'Tobacco', hex: '#6E5947', imageUrl: '/images/products/tobacco/luggage-tag.webp' },
  ],
  'manifest-anchor-latch': [
    { name: 'Charcoal', hex: '#1A1A1A', imageUrl: '/images/products/charcoal/anchor-latch.webp' },
    { name: 'Bronze', hex: '#8A5A2B', imageUrl: '/images/products/bronze/anchor-latch.webp' },
  ],
};

export function resolveSyntheticColorways(
  shopifyHandle: string,
): readonly SyntheticColorway[] | null {
  return SYNTHETIC_COLORWAYS[shopifyHandle] ?? null;
}
