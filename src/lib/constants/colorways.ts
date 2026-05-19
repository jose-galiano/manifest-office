// Brand colorway → hex. Single source of truth used by the PLP card swatch,
// the PDP buy-box swatch, and the synthetic-colorway map in plp-image-
// overrides. Any new finish needs exactly one entry here.

export const COLORWAY_HEX: Readonly<Record<string, string>> = {
  Charcoal: '#1A1A1A',
  Lichen: '#5C6B5A',
  Tobacco: '#6E5947',
  Bronze: '#8A5A2B',
};

export function resolveColorwayHex(name: string): string {
  return COLORWAY_HEX[name] ?? '#1A1A1A';
}
