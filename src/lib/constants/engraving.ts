// Engraving option metadata. Source of truth for which SKUs accept the
// monogrammed-engraving upcharge ("+€22 ENGRAVING") rendered on the PLP
// card and the PDP. Hardware (Anchor Latch, Luggage Tag) ships engraved by
// construction and does not take a separate engraving variant.

export const ENGRAVING_UPCHARGE_EUR = 22;

const HARDWARE_HANDLES = new Set<string>(['manifest-anchor-latch', 'manifest-luggage-tag']);

export function hasEngravingOption(shopifyHandle: string): boolean {
  return !HARDWARE_HANDLES.has(shopifyHandle);
}
