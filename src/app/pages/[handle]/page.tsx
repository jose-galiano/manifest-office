import { notFound } from 'next/navigation';

import { EditionBanner } from '@/components/sections/EditionBanner';
import { EditionsHero } from '@/components/sections/EditionsHero';
import { EditionsIntro } from '@/components/sections/EditionsIntro';
import { EditionsPhilosophy } from '@/components/sections/EditionsPhilosophy';
import { EditionsRoadmap } from '@/components/sections/EditionsRoadmap';
import { Practitioners } from '@/components/sections/Practitioners';
import { ProvenanceAtelier } from '@/components/sections/ProvenanceAtelier';
import { ProvenanceHero } from '@/components/sections/ProvenanceHero';
import { ProvenanceMap } from '@/components/sections/ProvenanceMap';
import { RepairPromise } from '@/components/sections/RepairPromise';
import { SystemAnchorLatch } from '@/components/sections/SystemAnchorLatch';
import { SystemEcosystem } from '@/components/sections/SystemEcosystem';
import { SystemStats } from '@/components/sections/SystemStats';
import { SystemThreeMotions } from '@/components/sections/SystemThreeMotions';
import { JsonLd, buildBreadcrumbList } from '@/lib/seo';

import type { Metadata } from 'next';
import type { ReactElement } from 'react';

// `/pages/:handle` — static content pages. Mirrors the canonical Shopify
// `routes.page_url` shape (docs/routing.md). Three handles render today:
// `system`, `provenance`, `editions`. Any other handle returns 404.
//
// TODO Agent-B: when src/content/manifest-office.ts ships, the STATIC_PAGES
// table here should source titles + meta-descriptions from that SoT.

const STATIC_PAGE_HANDLES = ['system', 'provenance', 'editions'] as const;
type StaticPageHandle = (typeof STATIC_PAGE_HANDLES)[number];
const STATIC_PAGE_SET: ReadonlySet<string> = new Set(STATIC_PAGE_HANDLES);

interface PageMeta {
  readonly title: string;
  readonly description: string;
}

const PAGE_META: Record<StaticPageHandle, PageMeta> = {
  system: {
    title: 'The Anchor Latch System',
    description:
      'One closure across every component. The Tech Pouch locks to the Cube; the Cube locks to the Field Tote. Patent pending EU 2026-04.',
  },
  provenance: {
    title: 'Provenance & Practitioners',
    description:
      'Made at Atelier Souto in Vila Nova de Famalicão, forty kilometres north of Porto. Three named practitioners. Repair, not replace.',
  },
  editions: {
    title: 'The Editions',
    description:
      'A finite allocation of a single thought. When an Edition closes, it stays closed. The archive, by issue.',
  },
};

function isStaticPageHandle(value: string): value is StaticPageHandle {
  return STATIC_PAGE_SET.has(value);
}

export function generateStaticParams(): { handle: StaticPageHandle }[] {
  return STATIC_PAGE_HANDLES.map((handle) => ({ handle }));
}

interface PageProps {
  params: Promise<{ handle: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { handle } = await params;
  if (!isStaticPageHandle(handle)) {
    return {};
  }
  const meta = PAGE_META[handle];
  return {
    title: meta.title,
    description: meta.description,
  };
}

function SystemPage(): ReactElement {
  return (
    <>
      <EditionBanner />
      <SystemAnchorLatch />
      <SystemThreeMotions />
      <SystemStats />
      <SystemEcosystem />
    </>
  );
}

function ProvenancePage(): ReactElement {
  return (
    <>
      <EditionBanner />
      <ProvenanceHero />
      <ProvenanceAtelier />
      <ProvenanceMap />
      <Practitioners eyebrow="— THREE NAMED PRACTITIONERS —" heading={'Cristina.\nMarc. Joana.'} />
      <RepairPromise />
    </>
  );
}

function EditionsPage(): ReactElement {
  return (
    <>
      <EditionBanner />
      <EditionsHero />
      <EditionsIntro />
      <EditionsRoadmap />
      <EditionsPhilosophy />
    </>
  );
}

const HANDLE_TO_VIEW: Record<StaticPageHandle, () => ReactElement> = {
  system: SystemPage,
  provenance: ProvenancePage,
  editions: EditionsPage,
};

export default async function StaticContentPage({ params }: PageProps): Promise<ReactElement> {
  const { handle } = await params;
  if (!isStaticPageHandle(handle)) {
    notFound();
  }
  const View = HANDLE_TO_VIEW[handle];
  const meta = PAGE_META[handle];
  return (
    <main className="bg-[#F2EFE8] text-[#0B0F0E]">
      {View()}
      <JsonLd
        id="page-breadcrumb-jsonld"
        schema={buildBreadcrumbList([
          { name: 'Manifest Office', url: '/' },
          { name: meta.title, url: `/pages/${handle}` },
        ])}
      />
    </main>
  );
}
