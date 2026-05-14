/**
 * Bottom footer — rendered on every route.
 *
 * Four columns, ink (#0B0F0E) background, paper type. Copy mirrors the
 * legacy variant-A footer in `deploy/index.html`, retargeted to the
 * canonical Shopify routes defined in `docs/routing.md`.
 */

import Link from 'next/link';

import { EDITION_01 } from '@/content/manifest-office';

import type { ReactElement } from 'react';

type FooterLink = {
  readonly href: string;
  readonly label: string;
  readonly external?: boolean;
};

const SYSTEM_LINKS: readonly FooterLink[] = [
  { href: '/pages/editions', label: 'Editions' },
  { href: '/collections/edition-01', label: 'Dossiers' },
  { href: '/collections/all', label: 'All dossiers' },
  { href: '/pages/system', label: 'The Anchor Latch' },
];

const PROVENANCE_LINKS: readonly FooterLink[] = [
  { href: '/pages/provenance', label: 'Atelier Souto, Porto' },
  { href: '/pages/provenance#materials', label: 'Materials list' },
  { href: '/pages/provenance#qc', label: 'QC standard' },
];

const OFFICE_LINKS: readonly FooterLink[] = [
  { href: 'mailto:hello@maelify.com', label: 'Returns & repair', external: true },
  { href: 'mailto:hello@maelify.com', label: 'Issue lookup', external: true },
  { href: 'mailto:hello@maelify.com', label: 'Contact', external: true },
  { href: 'mailto:press@maelify.com', label: 'Press', external: true },
];

function renderLink(link: FooterLink): ReactElement {
  const className =
    'block py-1 text-[14px] text-[var(--color-paper)]/85 hover:text-[var(--color-signal)] transition-colors';
  if (link.external) {
    return (
      <a key={link.label} href={link.href} className={className}>
        {link.label}
      </a>
    );
  }
  return (
    <Link key={link.label} href={link.href} className={className}>
      {link.label}
    </Link>
  );
}

export function Footer(): ReactElement {
  return (
    <footer
      className="bg-[var(--color-ink)] text-[var(--color-paper)] border-t border-[var(--color-rule-dark)]"
      role="contentinfo"
    >
      <div className="mx-auto max-w-[1400px] px-10 pt-16 pb-12">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-[2fr_1fr_1fr_1fr] pb-12 border-b border-[var(--color-rule-dark)]">
          <div>
            <p className="font-display text-[22px] font-bold tracking-[0.04em]">MANIFEST OFFICE</p>
            <p className="mt-4 max-w-[32ch] text-[14px] leading-[1.55] text-[var(--color-paper)]/65">
              The system inside the suitcase. Issued from Porto in finite Editions. The kit, not the
              suitcase.
            </p>
          </div>

          <div>
            <h4 className="font-mono text-[11px] tracking-[0.08em] uppercase text-[var(--color-lichen)] mb-[18px]">
              System
            </h4>
            {SYSTEM_LINKS.map(renderLink)}
          </div>

          <div>
            <h4 className="font-mono text-[11px] tracking-[0.08em] uppercase text-[var(--color-lichen)] mb-[18px]">
              Provenance
            </h4>
            {PROVENANCE_LINKS.map(renderLink)}
          </div>

          <div>
            <h4 className="font-mono text-[11px] tracking-[0.08em] uppercase text-[var(--color-lichen)] mb-[18px]">
              Office
            </h4>
            {OFFICE_LINKS.map(renderLink)}
          </div>
        </div>

        <div className="pt-8 flex flex-col gap-2 md:flex-row md:justify-between font-mono text-[11px] tracking-[0.06em] uppercase text-[var(--color-lichen)]">
          <span>© 2026 Manifest Office Goods · Issued in Porto</span>
          <span>
            Edition {EDITION_01.number} / {EDITION_01.anchor.replace('Strait of ', '')} /{' '}
            {EDITION_01.shipsBy}
          </span>
        </div>
      </div>
    </footer>
  );
}
