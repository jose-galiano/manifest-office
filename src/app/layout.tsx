import { Inter, JetBrains_Mono, Space_Grotesk } from 'next/font/google';

import { Analytics, AnalyticsNoScript } from '@/components/analytics/Analytics';
import { ClarityLoader } from '@/components/analytics/ClarityLoader';
import { CartDrawer } from '@/components/layout/CartDrawer';
import { ConsoleSignature } from '@/components/layout/ConsoleSignature';
import { Footer } from '@/components/layout/Footer';
import { Nav } from '@/components/layout/Nav';
import { EditionBanner } from '@/components/sections/EditionBanner';
import { LeadCapturePopup } from '@/components/sections/LeadCapturePopup';
import { CONSENT_DEFAULT_SCRIPT } from '@/lib/analytics';
import { JsonLd, buildOrganizationSchema, buildWebsiteSchema } from '@/lib/seo';

import type { Metadata, Viewport } from 'next';
import type { ReactElement, ReactNode } from 'react';

import './globals.css';

// Brand stack — Manifest Office brand bible §08:
// Display: Space Grotesk Bold (Diatype Wide substitute at mockup stage).
// Body: Inter (Diatype substitute).
// Mono: JetBrains Mono (Diatype Mono substitute).
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

export const metadata: Metadata = {
  metadataBase: new URL('https://demo.maelify.com'),
  title: {
    default: 'Manifest Office · Edition 01 · Gibraltar',
    template: '%s · Manifest Office',
  },
  description: 'A modular travel-kit system finished in Porto. Edition 01 — 1,200 systems issued.',
  applicationName: 'Manifest Office',
  authors: [{ name: 'Maelify', url: 'https://maelify.com' }],
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#0B0F0E',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>): ReactElement {
  return (
    <html
      lang="en"
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
        {/* Trackers live in <body>, not <head>. Client components inside
            <head> render but their effects/hooks behave unreliably (the
            PageViewTracker silently misses its first push). */}
        <Analytics />
        <AnalyticsNoScript />
        <ClarityLoader />
        <JsonLd id="org-jsonld" schema={buildOrganizationSchema()} />
        <JsonLd id="website-jsonld" schema={buildWebsiteSchema()} />
        {/* Global header: thin Edition status bar (h=36px, fixed top:0) plus
            sticky Nav (h=68px, fixed top:9). Pages own their own top spacing
            so bleeding sections (homepage hero, collection allocation strip)
            can extend up under the transparent Nav with their own dark bg,
            while interior pages set the nav-clearance themselves. */}
        <EditionBanner />
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
        <CartDrawer />
        <LeadCapturePopup />
        <ConsoleSignature />
      </body>
    </html>
  );
}
