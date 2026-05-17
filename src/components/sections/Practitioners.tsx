import Image from 'next/image';

import { Eyebrow } from '@/components/ui/Eyebrow';

import type { ReactElement } from 'react';

// "Three named practitioners" block — Cristina, Marc, Joana — used on the
// homepage and on /pages/provenance. Same data shape, same layout.
// TODO Agent-B: copy + portrait map should pull from
// src/content/manifest-office.ts (PRACTITIONERS) once that file lands.

interface Practitioner {
  readonly name: string;
  readonly role: string;
  readonly portrait: string;
  readonly portraitAlt: string;
  readonly bio: string;
  readonly quote: string;
}

const PRACTITIONERS: readonly Practitioner[] = [
  {
    name: 'Cristina Mendes',
    role: '— SAMPLE-ROOM LEAD',
    portrait: '/images/mood-board/v2/maker-cristina.webp',
    portraitAlt: 'Cristina Mendes at the Juki industrial machine in the Porto sample room',
    bio: 'Fourteen years in soft-goods construction. Built the first Manifest Office prototype on a hotel-room ironing board in March 2024. Runs the QC bench. Signs every dossier.',
    quote: '"A bag should be repaired, not replaced. We design for the third decade."',
  },
  {
    name: 'Marc Aubert',
    role: '— TECHNICAL · TRIMS & HARDWARE',
    portrait: '/images/mood-board/v2/maker-marc.webp',
    portraitAlt:
      'Marc Aubert inspecting an Anchor Latch with a jewelers loupe at the trims supplier',
    bio: 'A decade as a technical sales rep at a European trims supplier. Documents failure points on outdoor and commuter gear. Sourced every zip, every magnet, every paracord whip on the Edition 01 kit.',
    quote: '"The zip is where most carry fails. Spend there. Save elsewhere."',
  },
  {
    name: 'Joana Reis',
    role: '— FIELD TESTER · OPERATOR 00001',
    portrait: '/images/mood-board/v2/maker-joana.webp',
    portraitAlt: 'Joana Reis documenting a field test on a hotel desk in Mexico City',
    bio: 'Strategy consultant. Lisbon and Mexico City. Carried sample 7 through forty-three trips before we shipped Edition 01. Found the seam failure that triggered iteration 43.',
    quote: '"The first version of anything is wrong. The forty-third is honest."',
  },
];

interface PractitionersProps {
  heading?: string;
  eyebrow?: string;
}

export function Practitioners({
  heading = 'Three named\npractitioners.',
  eyebrow = '— THE OPERATORS BEHIND THE OFFICE —',
}: PractitionersProps): ReactElement {
  return (
    <section
      data-surface="ink"
      className="border-t border-[rgba(242,239,232,0.18)] bg-[#0B0F0E] py-16 md:py-[120px] text-[#F2EFE8]"
    >
      <header className="mx-auto mb-12 max-w-[1400px] px-5 md:px-10 md:mb-16">
        <Eyebrow className="mb-6 block">{eyebrow}</Eyebrow>
        <h2 className="whitespace-pre-line font-display font-bold leading-[0.95] tracking-[-0.02em] text-[clamp(40px,5vw,72px)]">
          {heading}
        </h2>
      </header>

      <div className="mx-auto flex max-w-[1400px] flex-col gap-14 px-5 md:hidden">
        {PRACTITIONERS.map((person) => (
          <article key={person.name} className="flex flex-col gap-6">
            <div className="aspect-[3/4] overflow-hidden bg-[#1a1a1a]">
              <Image
                src={person.portrait}
                alt={person.portraitAlt}
                width={600}
                height={800}
                sizes="100vw"
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <div className="font-mono text-[10px] tracking-[0.1em] uppercase text-signal">
                {person.role}
              </div>
              <h3 className="mt-2 font-display text-[28px] font-bold leading-[1] tracking-[-0.015em]">
                {person.name}
              </h3>
            </div>
            <p className="text-[15px] leading-[1.6] text-[#F2EFE8]/85">{person.bio}</p>
            <div className="border-t border-[rgba(242,239,232,0.18)] pt-4 font-display text-[16px] font-medium italic leading-[1.4] text-[#F2EFE8]/80">
              {person.quote}
            </div>
          </article>
        ))}
      </div>

      <div className="mx-auto hidden md:grid max-w-[1400px] md:grid-cols-3 md:gap-[60px] px-10">
        {PRACTITIONERS.map((person) => (
          <article key={person.name} className="group flex flex-col gap-6">
            <div className="aspect-[3/4] overflow-hidden bg-[#1a1a1a]">
              <Image
                src={person.portrait}
                alt={person.portraitAlt}
                width={600}
                height={800}
                sizes="(min-width: 1400px) 420px, 33vw"
                className="h-full w-full object-cover transition-transform duration-[1500ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
              />
            </div>
            <div>
              <div className="font-mono text-[10px] tracking-[0.1em] uppercase text-signal">
                {person.role}
              </div>
              <h3 className="mt-2 font-display text-[30px] font-bold leading-[1] tracking-[-0.015em]">
                {person.name}
              </h3>
            </div>
            <p className="text-[15px] leading-[1.6] text-[#F2EFE8]/85">{person.bio}</p>
            <div className="border-t border-[rgba(242,239,232,0.18)] pt-4 font-display text-[16px] font-medium italic leading-[1.4] text-[#F2EFE8]/80">
              {person.quote}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
