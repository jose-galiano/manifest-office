// next-intl request-scoped config. Picks the locale from the URL segment,
// validates it against the routing config, and loads the matching message
// catalog. Missing keys fall back to English at render time so the site
// never throws over an in-progress translation.

import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';

import { routing } from '@/i18n/routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  const messages = (await import(`@/messages/${locale}.json`)).default as Record<string, unknown>;

  return {
    locale,
    messages,
    // Force consistent number / date formatting across server and client.
    timeZone: 'Europe/Lisbon',
  };
});
