import { AtelierToggle } from '@/components/layout/AtelierToggle';

import type { ReactElement } from 'react';

// Global top announcement bar — fixed at the very top of the viewport on every
// route (mounted once in `app/layout.tsx`). Sits ABOVE the sticky `<Nav>`.
// Height is exactly 36px.
//
// Three slots:
//   left   — Edition label with status dot
//   centre — Atelier audio control (client island)
//   right  — Live allocation counter
//
// The atelier control is mounted here instead of as a floating bottom-right
// pill so the chrome stays consolidated in one strip (Muji discipline: one
// place for ambient/system signals, never floating chips on the canvas).
interface EditionBannerProps {
  /** Edition label, e.g. "EDITION 01 — GIBRALTAR" */
  edition?: string;
  /** Allocation counter, e.g. "ALLOCATION 00855 / 1200" */
  allocation?: string;
}

export function EditionBanner({
  edition = 'EDITION 01 — GIBRALTAR',
  allocation = 'ALLOCATION 00855 / 1200',
}: EditionBannerProps): ReactElement {
  return (
    <div className="fixed inset-x-0 top-0 z-[60] grid h-9 grid-cols-[1fr_auto_1fr] items-center bg-[#0B0F0E] px-5 md:px-10 text-[#F2EFE8]">
      <span className="justify-self-start font-mono text-[10px] md:text-[11px] tracking-[0.04em] uppercase">
        <span
          aria-hidden="true"
          className="mr-2 inline-block h-2 w-2 rounded-full bg-[#D24A1F] align-middle"
        />
        {/* Compact label on mobile (just the edition number) to leave room for
            the centred audio control. */}
        <span className="md:hidden">ED. 01</span>
        <span className="hidden md:inline">{edition}</span>
      </span>
      <div className="justify-self-center">
        <AtelierToggle />
      </div>
      <span className="justify-self-end font-mono text-[10px] md:text-[11px] tracking-[0.04em] uppercase text-[#D24A1F]">
        {/* Just the issued/total numbers on mobile to keep the strip readable. */}
        <span className="md:hidden tabular-nums">{allocation.replace(/^ALLOCATION\s*/i, '')}</span>
        <span className="hidden md:inline">{allocation}</span>
      </span>
    </div>
  );
}
