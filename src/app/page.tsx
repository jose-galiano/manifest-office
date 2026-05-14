import { DeskTeaser } from '@/components/sections/DeskTeaser';
import { EditionFeature } from '@/components/sections/EditionFeature';
import { HomeHero } from '@/components/sections/HomeHero';
import { Manifesto } from '@/components/sections/Manifesto';
import { Practitioners } from '@/components/sections/Practitioners';
import { Process } from '@/components/sections/Process';

import type { ReactElement } from 'react';

// Homepage — ported from deploy/index.html.
// Sections in order: hero (WebGL topo) → manifesto → edition feature → process
// → practitioners → desk teaser. Nav and footer are mounted by
// src/app/layout.tsx (Agent B).
export default function HomePage(): ReactElement {
  return (
    <main className="bg-[#F2EFE8] text-[#0B0F0E]">
      <HomeHero />
      <Manifesto />
      <EditionFeature />
      <Process />
      <Practitioners />
      <DeskTeaser />
    </main>
  );
}
