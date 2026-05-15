import { MonoCaption } from '@/components/ui/MonoCaption';

import type { ReactElement } from 'react';

// Four-up stats band for /pages/system. Static data — values are documented
// in the Anchor Latch product spec, not pulled from Shopify.

const STATS: readonly { label: string; value: string }[] = [
  { label: 'Cycle test · lab', value: '25,000' },
  { label: 'Hook tolerance', value: '±0.8mm' },
  { label: 'Field-serviceable parts', value: '6 / 6' },
  { label: 'Patent', value: 'EU 2026-04' },
];

export function SystemStats(): ReactElement {
  return (
    <section className="border-t border-[rgba(11,15,14,0.12)] bg-[#F2EFE8] px-5 md:px-10 py-24">
      <div className="mx-auto grid max-w-[1600px] grid-cols-2 gap-10 md:grid-cols-4">
        {STATS.map((stat, index) => (
          <div
            key={stat.label}
            className={`pr-6 ${index < STATS.length - 1 ? 'md:border-r md:border-[rgba(11,15,14,0.12)]' : ''}`}
          >
            <MonoCaption tone="lichen" className="mb-3 block tracking-[0.08em]">
              {stat.label}
            </MonoCaption>
            <div className="font-display font-bold leading-[0.9] tracking-[-0.025em] text-[clamp(36px,4vw,56px)] text-[#0B0F0E]">
              {stat.value}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
