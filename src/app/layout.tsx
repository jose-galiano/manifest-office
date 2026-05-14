import { Inter, JetBrains_Mono, Space_Grotesk } from 'next/font/google';

import { AtelierToggle } from '@/components/layout/AtelierToggle';
import { Footer } from '@/components/layout/Footer';
import { Nav } from '@/components/layout/Nav';

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
      <body className="min-h-full flex flex-col bg-[var(--color-paper)] text-[var(--color-ink)]">
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
        <AtelierToggle />
      </body>
    </html>
  );
}
