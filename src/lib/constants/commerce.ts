// Commerce constants. Single source of truth — these values appear inline
// in the legacy PDP closure (`FREE_SHIP_THRESHOLD`, `CUTOFF_HOUR`,
// `ENGRAVING_FEE`, etc.). All consumers (cart, reserve endpoint, hooks)
// must import from here.

export const ENGRAVING_FEE = 22;
export const ENGRAVING_MAX = 15;
// Maelify §3 — strip set, verbatim from legacy `api/reserve.js:36`.
// Allowed glyphs: A-Z 0-9 dot dash interpunct space.
export const ENGRAVING_ALLOWED_REGEX = /[^A-Z0-9.\-· ]/g;

export const FREE_SHIP_THRESHOLD = 150;
export const FLAT_SHIPPING_EUR = 8;
export const CUTOFF_HOUR = 14;
export const TIMEZONE_OFFSET_HOURS = 1;
export const CURRENCY = 'EUR';
