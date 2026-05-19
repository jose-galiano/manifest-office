/**
 * Bottom footer — rendered on every route. Server component, fully
 * translatable. Brand wordmark stays in English. Section titles, lede,
 * link labels and copyright pull from `messages/[locale].json#footer`.
 */

import { getTranslations } from 'next-intl/server';

import { EDITION_01 } from '@/content/manifest-office';
import { Link } from '@/i18n/navigation';

import type { ReactElement } from 'react';

type FooterLinkKey =
  | 'link_editions'
  | 'link_dossiers'
  | 'link_all_dossiers'
  | 'link_anchor_latch'
  | 'link_atelier_porto'
  | 'link_materials'
  | 'link_qc'
  | 'link_returns'
  | 'link_issue_lookup'
  | 'link_contact'
  | 'link_press';

type FooterLink = {
  readonly href: string;
  readonly key: FooterLinkKey;
  readonly external?: boolean;
};

const SYSTEM_LINKS: readonly FooterLink[] = [
  { href: '/pages/editions', key: 'link_editions' },
  { href: '/collections/edition-01', key: 'link_dossiers' },
  { href: '/collections/all', key: 'link_all_dossiers' },
  { href: '/pages/system', key: 'link_anchor_latch' },
];

const PROVENANCE_LINKS: readonly FooterLink[] = [
  { href: '/pages/provenance', key: 'link_atelier_porto' },
  { href: '/pages/provenance#materials', key: 'link_materials' },
  { href: '/pages/provenance#qc', key: 'link_qc' },
];

const OFFICE_LINKS: readonly FooterLink[] = [
  { href: 'mailto:hello@maelify.com', key: 'link_returns', external: true },
  { href: 'mailto:hello@maelify.com', key: 'link_issue_lookup', external: true },
  { href: 'mailto:hello@maelify.com', key: 'link_contact', external: true },
  { href: 'mailto:press@maelify.com', key: 'link_press', external: true },
];

function FooterLinkRow({
  link,
  label,
}: {
  readonly link: FooterLink;
  readonly label: string;
}): ReactElement {
  const className =
    'block py-1 text-[14px] text-[var(--color-paper)]/85 hover:text-signal transition-colors';
  if (link.external) {
    return (
      <a key={link.key} href={link.href} className={className}>
        {label}
      </a>
    );
  }
  return (
    <Link key={link.key} href={link.href} className={className}>
      {label}
    </Link>
  );
}

export async function Footer(): Promise<ReactElement> {
  const t = await getTranslations('footer');
  return (
    <footer
      data-surface="ink"
      className="bg-[var(--color-ink)] text-[var(--color-paper)] border-t border-[var(--color-rule-dark)]"
      role="contentinfo"
    >
      <div className="mx-auto max-w-[1400px] px-10 pt-16 pb-12">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-[2fr_1fr_1fr_1fr] pb-12 border-b border-[var(--color-rule-dark)]">
          <div>
            <p className="font-display text-[22px] font-bold tracking-[0.04em]">
              {t('brand').toUpperCase()}
            </p>
            <p className="mt-4 max-w-[32ch] text-[14px] leading-[1.55] text-[var(--color-paper)]/65">
              {t('lede')}
            </p>
          </div>

          <div>
            <h4 className="font-mono text-[11px] tracking-[0.08em] uppercase text-[var(--color-lichen)] mb-[18px]">
              {t('section_system')}
            </h4>
            {SYSTEM_LINKS.map((link) => (
              <FooterLinkRow key={link.key} link={link} label={t(link.key)} />
            ))}
          </div>

          <div>
            <h4 className="font-mono text-[11px] tracking-[0.08em] uppercase text-[var(--color-lichen)] mb-[18px]">
              {t('section_provenance')}
            </h4>
            {PROVENANCE_LINKS.map((link) => (
              <FooterLinkRow key={link.key} link={link} label={t(link.key)} />
            ))}
          </div>

          <div>
            <h4 className="font-mono text-[11px] tracking-[0.08em] uppercase text-[var(--color-lichen)] mb-[18px]">
              {t('section_office')}
            </h4>
            {OFFICE_LINKS.map((link) => (
              <FooterLinkRow key={link.key} link={link} label={t(link.key)} />
            ))}
          </div>
        </div>

        <div className="pt-8 flex flex-col gap-2 md:flex-row md:justify-between font-mono text-[11px] tracking-[0.06em] uppercase text-[var(--color-lichen)]">
          <span>{t('copyright')}</span>
          <span>
            {t('edition_meta', {
              number: EDITION_01.number,
              anchor: EDITION_01.anchor.replace('Strait of ', ''),
              shipsBy: EDITION_01.shipsBy,
            })}
          </span>
        </div>
      </div>
    </footer>
  );
}
