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

import type { ReactElement } from 'react';

interface TrustItem {
  readonly label: string;
  readonly value: string;
  readonly detail: string;
}

const ITEMS: readonly TrustItem[] = [
  {
    label: 'ORIGIN',
    value: 'Finished in Porto',
    detail: 'Cut, stitched, inspected by hand at Atelier Souto.',
  },
  {
    label: 'ALLOCATION',
    value: '1,200 systems',
    detail: 'Edition 01 — Strait of Gibraltar. Issued in series.',
  },
  {
    label: 'SHIPPING',
    value: 'Free across the EU',
    detail: 'Above €150. €8 flat below. 1–2 day transit.',
  },
  {
    label: 'RETURNS',
    value: '30 days',
    detail: 'Anchor-Latch hardware repaired for the lifetime of the kit.',
  },
];

export function TrustStrip(): ReactElement {
  return (
    <section
      aria-label="Manifest Office assurances"
      className="border-y border-[rgba(11,15,14,0.12)] bg-[#F2EFE8] text-[#0B0F0E]"
    >
      <div className="mx-auto grid max-w-[1800px] grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map((item, index) => (
          <div
            key={item.label}
            className={`flex flex-col gap-3 px-5 md:px-10 py-12 ${
              index < ITEMS.length - 1
                ? 'border-b border-[rgba(11,15,14,0.12)] lg:border-b-0 lg:border-r'
                : ''
            }`}
          >
            <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-[#D24A1F]">
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
