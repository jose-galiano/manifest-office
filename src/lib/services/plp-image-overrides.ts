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

// Alt-angle PDP gallery shots — generated img-to-img off the Charcoal hero
// so the silhouette and signal-orange accent stay consistent across the
// three tiles. Order is [detail, angle]. Returned as gallery tail when
// the override hero is set.
export const PDP_ALT_SHOTS_CHARCOAL: Readonly<Record<string, readonly string[]>> = {
  'manifest-field-tote': [
    '/images/products/charcoal-alt/field-tote-detail.webp',
    '/images/products/charcoal-alt/field-tote-angle.webp',
  ],
  'manifest-tech-pouch-s': [
    '/images/products/charcoal-alt/tech-pouch-s-detail.webp',
    '/images/products/charcoal-alt/tech-pouch-s-angle.webp',
  ],
  'manifest-tech-pouch-m': [
    '/images/products/charcoal-alt/tech-pouch-m-detail.webp',
    '/images/products/charcoal-alt/tech-pouch-m-angle.webp',
  ],
  'manifest-tech-pouch-l': [
    '/images/products/charcoal-alt/tech-pouch-l-detail.webp',
    '/images/products/charcoal-alt/tech-pouch-l-angle.webp',
  ],
  'manifest-cube-s': [
    '/images/products/charcoal-alt/cube-s-detail.webp',
    '/images/products/charcoal-alt/cube-s-angle.webp',
  ],
  'manifest-cube-m': [
    '/images/products/charcoal-alt/cube-m-detail.webp',
    '/images/products/charcoal-alt/cube-m-angle.webp',
  ],
  'manifest-cube-l': [
    '/images/products/charcoal-alt/cube-l-detail.webp',
    '/images/products/charcoal-alt/cube-l-angle.webp',
  ],
  'manifest-toiletry-kit': [
    '/images/products/charcoal-alt/toiletry-kit-detail.webp',
    '/images/products/charcoal-alt/toiletry-kit-angle.webp',
  ],
  'manifest-luggage-tag': [
    '/images/products/charcoal-alt/luggage-tag-detail.webp',
    '/images/products/charcoal-alt/luggage-tag-angle.webp',
  ],
  'manifest-anchor-latch': [
    '/images/products/charcoal-alt/anchor-latch-detail.webp',
    '/images/products/charcoal-alt/anchor-latch-angle.webp',
  ],
};

export function resolvePdpAltShots(shopifyHandle: string): readonly string[] {
  return PDP_ALT_SHOTS_CHARCOAL[shopifyHandle] ?? [];
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
