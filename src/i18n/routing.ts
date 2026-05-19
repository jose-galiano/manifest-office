// i18n routing surface — locales, default, and the prefix strategy.
//
// `localePrefix: 'always'` means EN renders at `/en/...`, not at `/...`. The
// alternative ('as-needed') leaves EN at the bare root and adds a prefix
// only for non-default locales — that's clever but it complicates hreflang
// and sitemap emission. Explicit `/en/...` is cleaner for SEO inspection
// and keeps every URL symmetric.
//
// Production note: at Plus scale we'd separate locale (`pt`) from market
// (`PT` vs `BR`) because they carry different tax, currency and shipping
// rules. This demo uses single-segment locale codes — see
// `docs/internationalization.md` for the production decision tree.

import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'es', 'pt', 'zh'] as const,
  defaultLocale: 'en',
  localePrefix: 'always',
  localeDetection: true,
});

export type Locale = (typeof routing.locales)[number];

export const LOCALE_LABELS: Readonly<Record<Locale, string>> = {
  en: 'EN',
  es: 'ES',
  pt: 'PT',
  zh: '中文',
};

export const LOCALE_FULL_NAMES: Readonly<Record<Locale, string>> = {
  en: 'English (United Kingdom)',
  es: 'Español (México)',
  pt: 'Português (Portugal)',
  zh: '中文（中国）',
};

// Each locale is anchored to a market: language + region + currency. EUR is
// the catalogue base; the helper in `lib/i18n/currency.ts` converts at
// display time. Rates are review-once frozen for the demo — production at
// Plus scale would pull market-specific price lists from Shopify Markets,
// not just an FX conversion.
export const LOCALE_MARKET: Readonly<
  Record<
    Locale,
    {
      readonly region: string;
      readonly currency: string;
      readonly ogLocale: string;
      readonly intlLocale: string;
    }
  >
> = {
  en: { region: 'GB', currency: 'GBP', ogLocale: 'en_GB', intlLocale: 'en-GB' },
  es: { region: 'MX', currency: 'MXN', ogLocale: 'es_MX', intlLocale: 'es-MX' },
  pt: { region: 'PT', currency: 'EUR', ogLocale: 'pt_PT', intlLocale: 'pt-PT' },
  zh: { region: 'CN', currency: 'CNY', ogLocale: 'zh_CN', intlLocale: 'zh-CN' },
};
