// Engraving option metadata. Source of truth for which SKUs accept the
// monogrammed-engraving upcharge ("+€22 ENGRAVING") rendered on the PLP
// card and the PDP. As of Edition 01 every SKU now ships with optional
// laser-etched engraving — soft goods on the leather pull-tab, hardware
// on the visible face (Luggage Tag) or lever shoulder (Anchor Latch).

export const ENGRAVING_UPCHARGE_EUR = 22;

export function hasEngravingOption(shopifyHandle: string): boolean {
  return shopifyHandle.startsWith('manifest-');
}
