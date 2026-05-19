// Display-only currency conversion. EUR is the catalogue base — Shopify
// stores list prices in EUR, the Reserve flow charges nothing, this helper
// converts at render time for the visible price tags.
//
// Rates are frozen at the demo's review date. Production at Plus scale
// would pull live per-market pricing from Shopify Markets (not just a
// conversion rate but a different price-list per region). The honest
// caption — "Display rate — production source: Shopify Markets" — is in
// BuildNotes panel 04 so a reviewing CTO doesn't mistake this for a real
// FX integration.

import { LOCALE_MARKET, type Locale } from '@/i18n/routing';

// Frozen rates, EUR base. Re-validate when the catalogue is bumped.
const EUR_RATES: Readonly<Record<string, number>> = {
  EUR: 1,
  GBP: 0.84,
  MXN: 22.4,
  CNY: 7.85,
};

export function resolveCurrency(locale: Locale): string {
  return LOCALE_MARKET[locale]?.currency ?? 'EUR';
}

export function convertFromEur(amountEur: number, currency: string): number {
  const rate = EUR_RATES[currency] ?? 1;
  return amountEur * rate;
}

export function formatPriceForLocale(amountEur: number, locale: Locale): string {
  const currency = resolveCurrency(locale);
  const value = convertFromEur(amountEur, currency);
  // MXN and CNY land cleanly at integer pesos / yuan; USD also rounds. EUR
  // historically rendered as `€118` (no decimals) so we keep parity by
  // rounding to integer for the visible price tag.
  const rounded = Math.round(value);
  const intlLocale = LOCALE_MARKET[locale]?.intlLocale ?? 'en-GB';
  try {
    return new Intl.NumberFormat(intlLocale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(rounded);
  } catch {
    return `${currency} ${rounded}`;
  }
}

export function formatCurrencyCaption(locale: Locale): string {
  const currency = resolveCurrency(locale);
  return `${currency} · Incl. tax`;
}
