import { Inter, JetBrains_Mono, Space_Grotesk } from 'next/font/google';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Analytics, AnalyticsNoScript } from '@/components/analytics/Analytics';
import { ClarityLoader } from '@/components/analytics/ClarityLoader';
import { BuildNotes } from '@/components/layout/BuildNotes';
import { CartDrawer } from '@/components/layout/CartDrawer';
import { ConsoleSignature } from '@/components/layout/ConsoleSignature';
import { Footer } from '@/components/layout/Footer';
import { Nav } from '@/components/layout/Nav';
import { WishlistDrawer } from '@/components/layout/WishlistDrawer';
import { WishlistShareHydrator } from '@/components/layout/WishlistShareHydrator';
import { EditionBanner } from '@/components/sections/EditionBanner';
import { LeadCapturePopup } from '@/components/sections/LeadCapturePopup';
import { LOCALE_MARKET, routing, type Locale } from '@/i18n/routing';
import { CONSENT_DEFAULT_SCRIPT } from '@/lib/analytics';
import { JsonLd, buildOrganizationSchema, buildWebsiteSchema } from '@/lib/seo';

import type { Metadata, Viewport } from 'next';
import type { ReactElement, ReactNode } from 'react';

// Brand stack — Manifest Office brand bible §08.
const displayFont = Space_Grotesk({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
});

const bodyFont = Inter({
  variable: '--font-body',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
});

const monoFont = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
});

function ogLocaleFor(locale: Locale): string {
  return LOCALE_MARKET[locale].ogLocale;
}

export function generateStaticParams(): Array<{ locale: Locale }> {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: requested } = await params;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: 'meta' }).catch(() => null);

  const title = t?.('site_title') ?? 'Manifest Office · Edition 01 · Gibraltar';
  const description =
    t?.('site_description') ??
    'A modular travel-kit system finished in Porto. Edition 01 — 1,200 systems issued.';

  const languageMap: Record<string, string> = {};
  for (const candidate of routing.locales) {
    languageMap[candidate] = `/${candidate}`;
  }

  return {
    metadataBase: new URL('https://demo.maelify.com'),
    title: {
      default: title,
      template: '%s · Manifest Office',
    },
    description,
    applicationName: 'Manifest Office',
    authors: [{ name: 'Maelify', url: 'https://maelify.com' }],
    robots: { index: true, follow: true },
    alternates: {
      canonical: `/${locale}`,
      languages: { ...languageMap, 'x-default': '/en' },
    },
    keywords: [
      'travel kit',
      'edition 01',
      'gibraltar',
      'porto',
      'tech pouch',
      'packing cubes',
      'field tote',
      'anchor latch',
      'headless shopify',
      'maelify',
    ],
    openGraph: {
      type: 'website',
      siteName: 'Manifest Office',
      locale: ogLocaleFor(locale as Locale),
      alternateLocale: routing.locales
        .filter((entry) => entry !== locale)
        .map((entry) => ogLocaleFor(entry)),
      url: `https://demo.maelify.com/${locale}`,
      title,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      creator: '@maelify',
    },
    category: 'shopping',
  };
}

export const viewport: Viewport = {
  themeColor: '#0B0F0E',
};

type LocaleLayoutProps = {
  readonly children: ReactNode;
  readonly params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps): Promise<ReactElement> {
  const { locale: requested } = await params;
  if (!hasLocale(routing.locales, requested)) notFound();
  const locale = requested;
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} h-full antialiased`}
    >
      <head>
        {/* Consent Mode v2 defaults MUST run before GTM injects any tag, so
            this is a raw inline script (App Router forbids `next/script`
            beforeInteractive outside `pages/_document.js`). Kept tiny and
            synchronous so it doesn't block FCP. */}
        <script dangerouslySetInnerHTML={{ __html: CONSENT_DEFAULT_SCRIPT }} />
      </head>
      <body
        data-surface="paper"
        className="min-h-full flex flex-col bg-[var(--color-paper)] text-[var(--color-ink)]"
      >
        <NextIntlClientProvider>
          <Analytics />
          <AnalyticsNoScript />
          <ClarityLoader />
          <JsonLd id="org-jsonld" schema={buildOrganizationSchema()} />
          <JsonLd id="website-jsonld" schema={buildWebsiteSchema()} />
          <EditionBanner />
          <Nav />
          <main className="flex-1">{children}</main>
          <Footer />
          <CartDrawer />
          <WishlistDrawer />
          <WishlistShareHydrator />
          <LeadCapturePopup />
          <BuildNotes />
          <ConsoleSignature />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
