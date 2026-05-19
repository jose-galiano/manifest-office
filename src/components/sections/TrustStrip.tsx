/**
 * `<TrustStrip />` — four-cell mono band of fulfilment + provenance signals.
 *
 * Dense, low-key, recruiter-readable as "this is a real store". Sits between
 * the featured-product grid and the brand manifesto so the scroll path is:
 *   hero → products → "we ship, we return, we make, we issue" → narrative.
 *
 * Brand-bible §14 rules respected: no countdown timer, no fake "5 PEOPLE
 * VIEWING NOW" scarcity, no review-aggregate stars. Just facts.
 */

import { getTranslations } from 'next-intl/server';

import type { ReactElement } from 'react';

type TrustKey = 'origin' | 'allocation' | 'shipping' | 'returns';
const TRUST_KEYS: readonly TrustKey[] = ['origin', 'allocation', 'shipping', 'returns'];

export async function TrustStrip(): Promise<ReactElement> {
  const t = await getTranslations('trust_strip');
  const items = TRUST_KEYS.map((key) => ({
    key,
    label: t(`${key}_label`).toUpperCase(),
    value: t(`${key}_value`),
    detail: t(`${key}_detail`),
  }));
  return (
    <section
      aria-label="Manifest Office assurances"
      className="border-y border-[rgba(11,15,14,0.12)] bg-[#F2EFE8] text-[#0B0F0E]"
    >
      <div className="mx-auto grid max-w-[1800px] grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item, index) => (
          <div
            key={item.key}
            className={`flex flex-col gap-3 px-5 md:px-10 py-12 ${
              index < items.length - 1
                ? 'border-b border-[rgba(11,15,14,0.12)] lg:border-b-0 lg:border-r'
                : ''
            }`}
          >
            <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-signal">
              {item.label}
            </span>
            <span className="font-display text-[24px] font-bold leading-[1.05] tracking-tight">
              {item.value}
            </span>
            <span className="max-w-[26ch] text-[13px] leading-[1.5] text-[#0B0F0E]/65">
              {item.detail}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
