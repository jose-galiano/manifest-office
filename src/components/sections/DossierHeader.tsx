/**
 * `<DossierHeader />` — sticky-feel header band sitting between the global
 * Nav (mounted by `app/layout.tsx`) and the PDP hero. Ports the legacy
 * `<header class="dossier-header">` block from `deploy/pdp.html` lines
 * 750-763.
 *
 * Three columns on desktop: breadcrumb + display title spanning the first
 * two columns, then a right-aligned mono meta strip listing dossier
 * ordinal, SKU ref, mass/volume and origin. On mobile the grid collapses
 * to a single column with the meta strip stacked underneath.
 */

import type { ReactElement } from 'react';

type MetaItem = {
  readonly label: string;
};

export type DossierHeaderProps = {
  /** Display title, rendered as the page `<h1>` (uppercased visually). */
  readonly title: string;
  /** Dossier ordinal — zero-padded number used in the breadcrumb. */
  readonly dossierNumber: number;
  /** Optional edition number override. Defaults to `01`. */
  readonly editionNumber?: string;
  /** Right-aligned meta items (ref, mass, origin). */
  readonly meta: readonly MetaItem[];
};

function padOrdinal(value: number): string {
  return String(value).padStart(2, '0');
}

export function DossierHeader({
  title,
  dossierNumber,
  editionNumber = '01',
  meta,
}: DossierHeaderProps): ReactElement {
  const ordinalLabel = padOrdinal(dossierNumber);
  const breadcrumb = `EDITIONS / ${editionNumber} / DOSSIERS / ${ordinalLabel}`;

  return (
    <header className="grid items-end gap-6 border-b border-[rgba(11,15,14,0.12)] px-5 md:px-10 pb-10 pt-[110px] md:pt-[140px] md:grid-cols-3 md:gap-12">
      <div className="md:col-span-2">
        <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#5C6B5A]">
          {breadcrumb}
        </div>
        <h1 className="mt-3 font-display text-[clamp(40px,7vw,72px)] font-bold uppercase leading-[0.92] tracking-[-0.02em] text-[#0B0F0E]">
          {title}
        </h1>
      </div>

      <dl className="flex flex-col gap-1 font-mono text-[11px] uppercase tracking-[0.06em] text-[#5C6B5A] md:text-right">
        <dt className="sr-only">Dossier metadata</dt>
        {meta.map((item) => (
          <dd key={item.label}>{item.label}</dd>
        ))}
      </dl>
    </header>
  );
}
