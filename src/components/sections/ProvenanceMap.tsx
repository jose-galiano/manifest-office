import { Eyebrow } from '@/components/ui/Eyebrow';
import { MonoCaption } from '@/components/ui/MonoCaption';

import type { ReactElement } from 'react';

// Three-city geographic-anchor block for /pages/provenance.
// Porto = manufactured. Lisbon = sample-iteration test. Mexico City =
// long-haul operator field tests. No graphic map — coordinates are listed
// as a typographic system, matching the brand voice ("we name the city").

interface Anchor {
  readonly city: string;
  readonly country: string;
  readonly coordinates: string;
  readonly role: string;
  readonly note: string;
}

const ANCHORS: readonly Anchor[] = [
  {
    city: 'Porto',
    country: 'Portugal',
    coordinates: '41°08′N 8°36′W',
    role: 'Manufactured.',
    note: 'Cut, stitched, inspected, and shipped from Atelier Souto, forty kilometres north of the city.',
  },
  {
    city: 'Lisbon',
    country: 'Portugal',
    coordinates: '38°43′N 9°08′W',
    role: 'Iterated.',
    note: 'Operator 00001 ran sample 7 through forty-three trips out of Lisbon between March 2024 and March 2026.',
  },
  {
    city: 'Mexico City',
    country: 'Mexico',
    coordinates: '19°25′N 99°08′W',
    role: 'Field-tested.',
    note: 'Long-haul testing leg. Documented the seam failure that triggered iteration 43.',
  },
];

export function ProvenanceMap(): ReactElement {
  return (
    <section
      id="materials"
      className="border-t border-[rgba(11,15,14,0.12)] bg-[#F2EFE8] px-5 md:px-10 py-16 md:py-[120px] scroll-mt-[120px]"
    >
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-16 grid grid-cols-1 items-end gap-20 md:grid-cols-2">
          <div>
            <Eyebrow className="mb-6 block" flanked>
              THE TRIANGLE
            </Eyebrow>
            <h2 className="font-display font-bold leading-[0.95] tracking-[-0.02em] text-[clamp(40px,5vw,72px)]">
              Three cities.
              <br />
              Named in full.
            </h2>
          </div>
          <p className="max-w-[44ch] text-[17px] leading-[1.6]">
            The kit was specified between Lisbon and Mexico City and built in Porto. We do not
            describe these places as &quot;Europe&quot; or &quot;the Americas.&quot; The cities are
            on the dossier.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-px border border-[rgba(11,15,14,0.12)] bg-[rgba(11,15,14,0.12)] md:grid-cols-3">
          {ANCHORS.map((anchor) => (
            <div key={anchor.city} className="flex flex-col gap-5 bg-[#F2EFE8] p-10">
              <div>
                <MonoCaption tone="signal" className="block">
                  {anchor.role}
                </MonoCaption>
              </div>
              <div>
                <h3 className="font-display text-[36px] font-bold leading-[1] tracking-[-0.02em] text-[#0B0F0E]">
                  {anchor.city}
                </h3>
                <div className="mt-1 font-mono text-[11px] tracking-[0.06em] uppercase text-[#5C6B5A]">
                  {anchor.country} · {anchor.coordinates}
                </div>
              </div>
              <p className="max-w-[36ch] text-[15px] leading-[1.6] text-[#0B0F0E]/85">
                {anchor.note}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
