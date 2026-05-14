import type { ReactElement } from 'react';

// The thin status strip that appears under the nav on interior pages.
// TODO Agent-B: when src/content/manifest-office.ts ships, replace the
// hardcoded allocation with the live counter (Shopify metafield). For now
// the placeholder mirrors deploy/system.html.
interface EditionBannerProps {
  /** Edition label, e.g. "EDITION 01 — GIBRALTAR" */
  edition?: string;
  /** Issuing origin label, e.g. "ISSUED FROM PORTO" */
  origin?: string;
  /** Allocation counter, e.g. "ALLOCATION 00855 / 1200" */
  allocation?: string;
  /** Shipping signal, e.g. "SHIPS IN 5 BUSINESS DAYS" */
  shipping?: string;
}

export function EditionBanner({
  edition = 'EDITION 01 — GIBRALTAR',
  origin = 'ISSUED FROM PORTO',
  allocation = 'ALLOCATION 00855 / 1200',
  shipping = 'SHIPS IN 5 BUSINESS DAYS',
}: EditionBannerProps): ReactElement {
  return (
    <div className="flex items-center justify-between gap-6 bg-[#0B0F0E] px-10 py-2.5 text-[#F2EFE8] flex-wrap">
      <div className="flex flex-wrap items-center gap-7">
        <span className="font-mono text-[11px] tracking-[0.04em] uppercase">
          <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#D24A1F] align-middle" />
          {edition}
        </span>
        <span className="font-mono text-[11px] tracking-[0.04em] uppercase">{origin}</span>
      </div>
      <div className="flex flex-wrap items-center gap-7">
        <span className="font-mono text-[11px] tracking-[0.04em] uppercase text-[#D24A1F]">
          {allocation}
        </span>
        <span className="font-mono text-[11px] tracking-[0.04em] uppercase">{shipping}</span>
      </div>
    </div>
  );
}
