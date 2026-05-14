import type { ReactElement } from 'react';

type CollectionHeaderProps = {
  readonly eyebrow: string;
  readonly title: string;
  readonly summary: string;
  readonly meta?: ReadonlyArray<{ readonly term: string; readonly value: string }>;
  // When the collection has a defined edition (e.g. Edition 01), render the
  // dark allocation banner above the header. Counter values come from the
  // page-level data fetch so the banner stays in sync with the grid.
  readonly allocation?: {
    readonly issued: number;
    readonly total: number;
    readonly editionLabel: string;
    readonly originLabel: string;
    readonly shipsInLabel: string;
  };
};

function formatIssued(issued: number): string {
  return String(issued).padStart(5, '0');
}

// Header band for `/collections/[handle]`. Three rows:
//   1. Optional dark allocation banner (ink background, signal counter).
//   2. Breadcrumb / eyebrow in mono lichen.
//   3. Two-column grid: oversized display heading + summary + meta-grid.
export function CollectionHeader({
  eyebrow,
  title,
  summary,
  meta,
  allocation,
}: CollectionHeaderProps): ReactElement {
  return (
    <>
      {allocation ? (
        <div className="flex flex-wrap items-center justify-between gap-y-2 bg-[#0B0F0E] px-10 py-2.5 text-[#F2EFE8]">
          <div className="flex items-center gap-7">
            <span className="font-mono text-[11px] uppercase tracking-[0.04em]">
              <span
                aria-hidden="true"
                className="mr-2 inline-block h-2 w-2 rounded-full bg-[#D24A1F] align-middle"
              />
              {allocation.editionLabel}
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.04em]">
              {allocation.originLabel}
            </span>
          </div>
          <div className="flex items-center gap-7">
            <span className="font-mono text-[11px] uppercase tracking-[0.04em] text-[#D24A1F]">
              ALLOCATION {formatIssued(allocation.issued)} / {allocation.total}
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.04em]">
              {allocation.shipsInLabel}
            </span>
          </div>
        </div>
      ) : null}

      <header className="border-b border-[rgba(11,15,14,0.12)] bg-[#F2EFE8] px-10 pb-12 pt-16 text-[#0B0F0E]">
        <div className="mx-auto max-w-[1600px]">
          <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.06em] text-[#5C6B5A]">
            {eyebrow}
          </div>
          <div className="grid items-end gap-12 md:grid-cols-[2fr_1fr] md:gap-20">
            <h1 className="font-display text-[clamp(56px,8vw,120px)] font-bold leading-[0.92] tracking-[-0.03em]">
              {title}
            </h1>
            <div>
              <p className="font-mono text-[12px] uppercase leading-[1.6] tracking-[0.06em] text-[#5C6B5A]">
                {summary}
              </p>
              {meta && meta.length > 0 ? (
                <dl className="mt-8 grid grid-cols-2 gap-x-8 gap-y-3 border-t border-[rgba(11,15,14,0.12)] pt-4 font-mono text-[11px] uppercase tracking-[0.04em]">
                  {meta.map((entry) => (
                    <div key={entry.term} className="contents">
                      <dt className="text-[#5C6B5A]">{entry.term}</dt>
                      <dd>{entry.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
