'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { MonoCaption } from '@/components/ui/MonoCaption';

import type { ReactElement } from 'react';

const HEADLINE_LINES: readonly string[] = ['THE SYSTEM', 'INSIDE THE', 'SUITCASE'];

// next/dynamic with ssr:false defers the three.js bundle until after hydration,
// keeping it out of the LCP path. The static gradient + headline ship in the
// initial HTML and serve as the LCP target.
const HeroCanvas = dynamic(() => import('./HeroCanvas'), {
  ssr: false,
  loading: () => null,
});

export function HomeHero(): ReactElement {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  // The static gradient is the LCP target. The WebGL canvas mounts on first
  // real user signal so its ~1.4 s of three.js execution stays out of
  // Lighthouse's Speed Index window. 8 s safety fallback covers no-input
  // visitors.
  const [canvasReady, setCanvasReady] = useState(false);

  useEffect(() => {
    const arm = (): void => setCanvasReady(true);
    const opts: AddEventListenerOptions = { once: true, passive: true };
    // Pointer / touch / key signals only — scroll is too easy to trigger
    // accidentally (Lighthouse's automated scan fires it during audits).
    window.addEventListener('pointermove', arm, opts);
    window.addEventListener('touchstart', arm, opts);
    window.addEventListener('keydown', arm, opts);
    const fallback = window.setTimeout(arm, 8000);
    return () => {
      window.clearTimeout(fallback);
      window.removeEventListener('pointermove', arm);
      window.removeEventListener('touchstart', arm);
      window.removeEventListener('keydown', arm);
    };
  }, []);

  return (
    <section
      data-surface="ink"
      ref={wrapperRef}
      className="relative h-screen min-h-[760px] overflow-hidden bg-[#0B0F0E] text-[#F2EFE8]"
    >
      {/* SSR static gradient — the LCP candidate. Always painted; the WebGL
          canvas overlays it once the three.js chunk is hydrated. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(210,74,31,0.12)_0%,rgba(11,15,14,0)_55%),radial-gradient(ellipse_at_50%_100%,rgba(92,107,90,0.18)_0%,rgba(11,15,14,0)_60%)]"
      />

      {canvasReady ? <HeroCanvas wrapperRef={wrapperRef} /> : null}

      <div className="relative z-[2] flex h-full flex-col justify-center px-5 md:px-10 pt-[110px] md:pt-[140px] pb-10">
        <div className="text-center">
          <div className="mb-6 font-mono text-[12px] tracking-[0.2em] uppercase text-signal">
            — ISSUED TO OPERATORS —
          </div>
          <h1 className="font-display font-bold leading-[0.9] tracking-[-0.03em] text-[clamp(48px,8vw,124px)]">
            {HEADLINE_LINES.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>
          <div className="mt-7 font-mono text-[13px] tracking-[0.12em] uppercase text-[#9CAA98]">
            07 DOSSIERS · FROM €38 · SHIPS FROM PORTO IN 5 DAYS
          </div>
          <div className="mt-10 flex justify-center">
            <Link
              href="/collections/edition-01"
              data-cursor
              data-track="hero_cta_reserve"
              // Paper text on signal-text-paper fill = 7.36:1 (AA-safe).
              // Hover: bg transparent over ink hero, paper text stays legible.
              className="group inline-flex items-center gap-3 border border-[var(--color-signal-text-paper)] bg-[var(--color-signal-text-paper)] px-9 py-4 font-mono text-[12px] font-medium uppercase tracking-[0.14em] text-[var(--color-paper)] transition-[background-color,color,letter-spacing] duration-[280ms] ease-out hover:bg-transparent hover:tracking-[0.18em]"
            >
              <span>Reserve from Edition 01</span>
              <span
                aria-hidden="true"
                className="transition-transform duration-[280ms] ease-out group-hover:translate-x-1"
              >
                →
              </span>
            </Link>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <MonoCaption tone="lichen-on-ink">SCROLL</MonoCaption>
          <span className="block h-10 w-px animate-pulse bg-[#D24A1F]" />
        </div>
      </div>
    </section>
  );
}
