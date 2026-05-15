import { DeskTeaser } from '@/components/sections/DeskTeaser';
import { EditionFeature } from '@/components/sections/EditionFeature';
import { EditorialGallery } from '@/components/sections/EditorialGallery';
import { EmailCapture } from '@/components/sections/EmailCapture';
import { FeaturedDossiers } from '@/components/sections/FeaturedDossiers';
import { FinalReserveCTA } from '@/components/sections/FinalReserveCTA';
import { HomeHero } from '@/components/sections/HomeHero';
import { Manifesto } from '@/components/sections/Manifesto';
import { Practitioners } from '@/components/sections/Practitioners';
import { Process } from '@/components/sections/Process';
import { TrustStrip } from '@/components/sections/TrustStrip';

import type { ReactElement } from 'react';

// Allocation counters refresh per request (FeaturedDossiers + FinalReserveCTA
// both call `fetchManifestProducts()`). The hero is static so the page is
// still fast — only the two product-aware sections pull live data.
export const dynamic = 'force-dynamic';

// Homepage section order optimised for the conversion path identified in the
// May 2026 e-commerce audit:
//   1. Hero with one CTA           (5-second clarity + "shop" affordance)
//   2. Featured Dossiers           (visible products — biggest single lift)
//   3. Trust strip                 (shipping / returns / origin / allocation)
//   4. Manifesto                   (brand voice)
//   5. Edition feature             (Gibraltar anchor)
//   6. Process                     (specified → made → issued)
//   7. Practitioners               (named-operator social proof)
//   8. Final reserve CTA           (closing prompt with live allocation)
//   9. Desk teaser                 (AI Trip Packer / agentic affordance)
//  10. Email capture               (Edition 02 list)
export default function HomePage(): ReactElement {
  return (
    <main className="bg-[#F2EFE8] text-[#0B0F0E]">
      <HomeHero />
      <FeaturedDossiers />
      <TrustStrip />
      <Manifesto />
      <EditorialGallery />
      <EditionFeature />
      <Process />
      <Practitioners />
      <FinalReserveCTA />
      <DeskTeaser />
      <EmailCapture />
    </main>
  );
}
