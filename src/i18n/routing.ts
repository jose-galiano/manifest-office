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
  en: 'English',
  es: 'Español',
  pt: 'Português',
  zh: '中文',
};
