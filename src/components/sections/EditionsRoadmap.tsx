import Image from 'next/image';

import { MonoCaption } from '@/components/ui/MonoCaption';
import { Link } from '@/i18n/navigation';

import type { ReactElement } from 'react';

// Edition 01 active + Edition 02 announced + Edition 03 placeholder.
// Future-edition rows render in muted opacity to communicate the "locked"
// state; active edition links into /collections/edition-01.

interface EditionEntry {
  readonly status: 'active' | 'announced' | 'placeholder';
  readonly label: string;
  readonly title: string;
  readonly summary: string;
  readonly image: string;
  readonly imageAlt: string;
  readonly meta?: readonly { term: string; definition: string }[];
  readonly cta?: { label: string; href: string };
  readonly lockedNote?: string;
}

const ENTRIES: readonly EditionEntry[] = [
  {
    status: 'active',
    label: '— EDITION 01 · ACTIVE',
    title: 'Gibraltar.\n1:250,000.',
    summary:
      'The Strait. The line where the Mediterranean meets the Atlantic. Signal orange. Hypalon-reinforced tech pouch. Twelve hundred systems.',
    image: '/images/mood-board/v1/04-broadside-edition.webp',
    imageAlt: 'Edition 01 Gibraltar topographic broadside',
    meta: [
      { term: 'Anchor', definition: "Strait of Gibraltar · 36°08'N 5°21'W" },
      { term: 'Accent', definition: 'Signal Orange · #D24A1F' },
      { term: 'Guest material', definition: 'Hypalon reinforcement' },
      { term: 'Allocation', definition: '855 / 1200 issued' },
      { term: 'Issued from', definition: 'Porto · 2026-Q2' },
    ],
    cta: { label: 'Open Edition 01', href: '/collections/edition-01' },
  },
  {
    status: 'announced',
    label: '— EDITION 02 · ANNOUNCED Q3 2026',
    title: 'Atacama.\nReserved.',
    summary:
      'The driest desert on earth. Lichen green accent. A guest material announced at issue. The full brief opens when Edition 01 closes.',
    image: '/images/mood-board/v1/02-field-document-lisbon.webp',
    imageAlt: 'Edition 02 placeholder',
    meta: [
      { term: 'Anchor', definition: 'Atacama · 24°S 69°W' },
      { term: 'Accent', definition: 'Lichen — proposed' },
      { term: 'Allocation', definition: '1,200 systems — reserved' },
      { term: 'Issuing from', definition: 'Porto · 2026-Q3' },
    ],
    lockedNote: 'Opens when Edition 01 closes',
  },
  {
    status: 'placeholder',
    label: '— EDITION 03 · ANNOUNCED 2027',
    title: 'To be\ndocumented.',
    summary:
      'Geographic anchor under selection. The brief publishes when the team returns from the field. Operators on the waitlist are notified first.',
    image: '/images/mood-board/v1/14-field-document-mexico.webp',
    imageAlt: 'Edition 03 placeholder',
    lockedNote: 'Brief — under construction',
  },
];

export function EditionsRoadmap(): ReactElement {
  return (
    <section className="border-t border-[rgba(11,15,14,0.12)] bg-[#F2EFE8] px-5 md:px-10 py-16 md:py-[120px]">
      <div className="mx-auto max-w-[1600px]">
        <h2 className="mb-16 font-display font-bold leading-[0.95] tracking-[-0.02em] text-[clamp(40px,5vw,64px)]">
          The archive,
          <br />
          by issue.
        </h2>

        <div className="border-b border-[rgba(11,15,14,0.12)]">
          {ENTRIES.map((entry) => {
            const muted = entry.status !== 'active';
            return (
              <div
                key={entry.label}
                className={`grid grid-cols-1 items-center gap-20 border-t border-[rgba(11,15,14,0.12)] py-20 md:grid-cols-[1.2fr_1fr] ${muted ? 'opacity-50' : ''}`}
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <Image
                    src={entry.image}
                    alt={entry.imageAlt}
                    width={1600}
                    height={1200}
                    className="h-full w-full object-cover transition-transform duration-[1500ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.05]"
                  />
                </div>
                <div>
                  <MonoCaption
                    tone={entry.status === 'active' ? 'signal' : 'lichen'}
                    className="mb-4 block tracking-[0.1em]"
                  >
                    {entry.label}
                  </MonoCaption>
                  <h3 className="mb-5 whitespace-pre-line font-display font-bold leading-[0.92] tracking-[-0.02em] text-[clamp(40px,5vw,72px)]">
                    {entry.title}
                  </h3>
                  <p className="mb-8 max-w-[42ch] text-[17px] leading-[1.55] text-[#0B0F0E]/80">
                    {entry.summary}
                  </p>
                  {entry.meta ? (
                    <dl className="mb-8 grid grid-cols-[140px_1fr] gap-x-7 gap-y-2 border-t border-[rgba(11,15,14,0.12)] pt-6 font-mono text-[11px] tracking-[0.04em] uppercase">
                      {entry.meta.map((row) => (
                        <div key={row.term} className="contents">
                          <dt className="text-[#9CAA98]">{row.term}</dt>
                          <dd className="text-[#0B0F0E]">{row.definition}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}
                  {entry.cta ? (
                    <Link
                      href={entry.cta.href}
                      className="inline-flex items-center gap-2.5 bg-[#0B0F0E] px-6 py-3.5 font-mono text-[11px] tracking-[0.12em] uppercase text-[#F2EFE8] transition-all duration-300 hover:bg-[#D24A1F] hover:tracking-[0.16em]"
                    >
                      {entry.cta.label} <span aria-hidden="true">→</span>
                    </Link>
                  ) : null}
                  {entry.lockedNote ? (
                    <MonoCaption tone="lichen" className="tracking-[0.08em]">
                      {entry.lockedNote}
                    </MonoCaption>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
