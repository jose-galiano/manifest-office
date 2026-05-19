import { getTranslations } from 'next-intl/server';

import { AtelierToggle } from '@/components/layout/AtelierToggle';

import type { ReactElement } from 'react';

// Global top announcement bar — fixed at the very top of the viewport on every
// route (mounted once in `app/[locale]/layout.tsx`). Sits ABOVE the sticky
// `<Nav>`. Height is exactly 36px.
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
  /** Live allocation counter, e.g. "ALLOCATION 00855 / 1200" — falls back to the translated string when omitted. */
  allocation?: string;
}

export async function EditionBanner({
  allocation,
}: EditionBannerProps = {}): Promise<ReactElement> {
  const t = await getTranslations('edition_banner');
  const edition = t('label');
  const allocationLabel = allocation ?? t('allocation', { issued: '00855', total: '1200' });

  return (
    <div
      data-surface="ink"
      className="fixed inset-x-0 top-0 z-[60] grid h-9 grid-cols-[1fr_auto_1fr] items-center bg-[#0B0F0E] px-5 md:px-10 text-[#F2EFE8]"
    >
      <span className="justify-self-start font-mono text-[10px] md:text-[11px] tracking-[0.04em] uppercase">
        <span
          aria-hidden="true"
          className="mr-2 inline-block h-2 w-2 rounded-full bg-[#D24A1F] align-middle"
        />
        <span className="md:hidden">ED. 01</span>
        <span className="hidden md:inline">{edition}</span>
      </span>
      <div className="justify-self-center">
        <AtelierToggle />
      </div>
      <span className="justify-self-end font-mono text-[10px] md:text-[11px] tracking-[0.04em] uppercase text-signal">
        <span className="md:hidden tabular-nums">{allocationLabel.replace(/^[A-Z]+\s*/i, '')}</span>
        <span className="hidden md:inline">{allocationLabel}</span>
      </span>
    </div>
  );
}
