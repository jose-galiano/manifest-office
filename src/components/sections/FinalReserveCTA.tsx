/**
 * `<FinalReserveCTA />` — closing dark-bleed call to action.
 *
 * Sits near the bottom of the homepage so a visitor who scrolls through the
 * narrative gets a second, decisive prompt to act. Uses the live allocation
 * counter from Shopify so the scarcity signal is real, never fabricated
 * (brand-bible §14 anti-brief: no countdown theatre).
 */

import { getTranslations } from 'next-intl/server';

import { EDITION_01 } from '@/content/manifest-office';
import { Link } from '@/i18n/navigation';
import { fetchManifestProducts } from '@/lib/services/fetch-products';

import type { ReactElement } from 'react';

function deriveIssued(): Promise<number> {
  return fetchManifestProducts().then((result) => {
    if (!result.ok || result.data.products.length === 0) return 0;
    // The counter is shared across SKUs; take the max as the freshest reading.
    return result.data.products.reduce(
      (highest, product) => Math.max(highest, product.editionIssued),
      0,
    );
  });
}

export async function FinalReserveCTA(): Promise<ReactElement> {
  const issued = await deriveIssued();
  const total = EDITION_01.totalAllocation;
  const remaining = Math.max(0, total - issued);
  const padded = String(issued).padStart(5, '0');
  const t = await getTranslations('final_reserve');

  return (
    <section
      data-surface="ink"
      aria-label="Reserve from Edition 01"
      className="bg-[#0B0F0E] px-5 md:px-10 py-20 md:py-[140px] text-[#F2EFE8]"
    >
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-end gap-16 md:grid-cols-[1.5fr_1fr] md:gap-24">
        <div>
          <span className="mb-7 block font-mono text-[11px] tracking-[0.12em] uppercase text-signal">
            <span
              aria-hidden="true"
              className="mr-2 inline-block h-2 w-2 rounded-full bg-[#D24A1F] align-middle"
            />
            {t('eyebrow_open').toUpperCase()}
          </span>
          <h2 className="font-display font-bold leading-[0.92] tracking-[-0.03em] text-[clamp(48px,7vw,112px)]">
            {t('remaining_systems', { remaining: remaining.toLocaleString('en-GB') })}
            <br />
            {t('title_remaining')}
          </h2>
          <p className="mt-8 max-w-[44ch] text-[17px] leading-[1.55] text-[#F2EFE8]/75">
            {t('subtitle')}
          </p>
        </div>

        <div className="flex flex-col gap-6">
          <dl className="border-t border-[rgba(242,239,232,0.18)] pt-6 font-mono text-[11px] tracking-[0.08em] uppercase">
            <div className="flex items-baseline justify-between gap-6 py-2.5">
              <dt className="text-[#F2EFE8]/55">Allocation</dt>
              <dd className="text-signal tabular-nums">
                {padded} / {total.toLocaleString('en-GB')}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-6 border-t border-[rgba(242,239,232,0.12)] py-2.5">
              <dt className="text-[#F2EFE8]/55">Remaining</dt>
              <dd>{remaining.toLocaleString('en-GB')} systems</dd>
            </div>
            <div className="flex items-baseline justify-between gap-6 border-t border-[rgba(242,239,232,0.12)] py-2.5">
              <dt className="text-[#F2EFE8]/55">Issued from</dt>
              <dd>
                {EDITION_01.issuedFrom} · {EDITION_01.shipsBy}
              </dd>
            </div>
          </dl>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/collections/edition-01"
              data-cursor
              data-track="final_cta_reserve"
              data-track-remaining={String(remaining)}
              className="group inline-flex items-center justify-center gap-3 border border-[#D24A1F] bg-[#A8350F] px-9 py-4 font-mono text-[12px] uppercase tracking-[0.14em] text-[#F2EFE8] transition-[background-color,letter-spacing] duration-[280ms] ease-out hover:bg-transparent hover:tracking-[0.18em]"
            >
              <span>{t('cta')}</span>
              <span
                aria-hidden="true"
                className="transition-transform duration-[280ms] ease-out group-hover:translate-x-1"
              >
                →
              </span>
            </Link>
            <Link
              href="/pages/system"
              data-cursor
              data-track="final_cta_read_system"
              className="inline-flex items-center justify-center px-1 font-mono text-[11px] uppercase tracking-[0.12em] text-[#F2EFE8]/75 underline underline-offset-[6px] decoration-[rgba(242,239,232,0.25)] transition-colors duration-200 hover:text-[#F2EFE8] hover:decoration-[#D24A1F]"
            >
              Read the system →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
