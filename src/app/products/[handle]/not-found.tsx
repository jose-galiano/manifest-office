import Link from 'next/link';

import type { ReactElement } from 'react';

// PDP not-found state. Keeps the visual chrome of the storefront so a typoed
// or stale URL doesn't dump the visitor onto a default Next 404.
export default function DossierNotFound(): ReactElement {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center bg-[#F2EFE8] px-10 py-32 text-center text-[#0B0F0E]">
      <span className="mb-4 font-mono text-[11px] uppercase tracking-[0.08em] text-[#D24A1F]">
        DOSSIER · NOT FOUND
      </span>
      <h1 className="max-w-[20ch] font-display text-[clamp(48px,7vw,96px)] font-bold leading-[0.95] tracking-[-0.02em]">
        This dossier is not in Edition 01.
      </h1>
      <p className="mt-6 max-w-[48ch] text-[16px] leading-[1.55] text-[#0B0F0E]/85">
        The URL may be from a previous edition or mistyped. Every issued dossier sits inside the
        Edition 01 collection.
      </p>
      <Link
        href="/collections/edition-01"
        data-cursor
        className="mt-10 inline-flex items-center gap-2 bg-[#0B0F0E] px-6 py-4 font-mono text-[12px] uppercase tracking-[0.1em] text-[#F2EFE8] transition-[letter-spacing,background] hover:bg-[#D24A1F] hover:tracking-[0.14em]"
      >
        Browse Edition 01 →
      </Link>
    </main>
  );
}
