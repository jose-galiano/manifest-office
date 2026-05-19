import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

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

const STATIC_PAGE_HANDLES = ['system', 'provenance', 'editions'] as const;
type StaticPageHandle = (typeof STATIC_PAGE_HANDLES)[number];
const STATIC_PAGE_SET: ReadonlySet<string> = new Set(STATIC_PAGE_HANDLES);

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
  const t = await getTranslations('static_pages');
  return {
    title: t(`${handle}.title`),
    description: t(`${handle}.description`),
  };
}

function SystemPage(): ReactElement {
  return (
    <>
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
      <ProvenanceHero />
      <ProvenanceAtelier />
      <ProvenanceMap />
      <Practitioners />
      <RepairPromise />
    </>
  );
}

function EditionsPage(): ReactElement {
  return (
    <>
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
  const t = await getTranslations('static_pages');
  const View = HANDLE_TO_VIEW[handle];
  return (
    <main className="bg-[#F2EFE8] text-[#0B0F0E]">
      {View()}
      <JsonLd
        id="page-breadcrumb-jsonld"
        schema={buildBreadcrumbList([
          { name: 'Manifest Office', url: '/' },
          { name: t(`${handle}.title`), url: `/pages/${handle}` },
        ])}
      />
    </main>
  );
}
