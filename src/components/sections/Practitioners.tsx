import Image from 'next/image';
import { getTranslations } from 'next-intl/server';

import { Eyebrow } from '@/components/ui/Eyebrow';

import type { ReactElement } from 'react';

// "Three named practitioners" block — Cristina, Marc, Joana — used on the
// homepage and on /pages/provenance. Same data shape, same layout.
// TODO Agent-B: copy + portrait map should pull from
// src/content/manifest-office.ts (PRACTITIONERS) once that file lands.

type PractitionerKey = 'cristina' | 'marc' | 'joana';

const PRACTITIONER_KEYS: readonly { key: PractitionerKey; portrait: string }[] = [
  { key: 'cristina', portrait: '/images/mood-board/v2/maker-cristina.webp' },
  { key: 'marc', portrait: '/images/mood-board/v2/maker-marc.webp' },
  { key: 'joana', portrait: '/images/mood-board/v2/maker-joana.webp' },
];

interface PractitionersProps {
  heading?: string;
  eyebrow?: string;
}

export async function Practitioners({
  heading,
  eyebrow,
}: PractitionersProps = {}): Promise<ReactElement> {
  const t = await getTranslations('practitioners');
  const resolvedHeading = heading ?? t('heading');
  const resolvedEyebrow = (eyebrow ?? `— ${t('eyebrow').toUpperCase()} —`).toUpperCase();
  const practitioners = PRACTITIONER_KEYS.map(({ key, portrait }) => ({
    key,
    name: t(`${key}_name`),
    role: `— ${t(`${key}_role`).toUpperCase()}`,
    portrait,
    portraitAlt: t(`${key}_alt`),
    bio: t(`${key}_bio`),
    quote: t(`${key}_quote`),
  }));
  return (
    <section
      data-surface="ink"
      className="border-t border-[rgba(242,239,232,0.18)] bg-[#0B0F0E] py-16 md:py-[120px] text-[#F2EFE8]"
    >
      <header className="mx-auto mb-12 max-w-[1400px] px-5 md:px-10 md:mb-16">
        <Eyebrow className="mb-6 block">{resolvedEyebrow}</Eyebrow>
        <h2 className="whitespace-pre-line font-display font-bold leading-[0.95] tracking-[-0.02em] text-[clamp(40px,5vw,72px)]">
          {resolvedHeading}
        </h2>
      </header>

      <div className="mx-auto flex max-w-[1400px] flex-col gap-14 px-5 md:hidden">
        {practitioners.map((person) => (
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
        {practitioners.map((person) => (
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
