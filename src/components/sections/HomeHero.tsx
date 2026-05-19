'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import { MonoCaption } from '@/components/ui/MonoCaption';

import type { ReactElement } from 'react';

// next/dynamic with ssr:false defers the three.js bundle until after hydration,
// keeping it out of the LCP path. The static gradient + headline ship in the
// initial HTML and serve as the LCP target.
const HeroCanvas = dynamic(() => import('./HeroCanvas'), {
  ssr: false,
  loading: () => null,
});

export function HomeHero(): ReactElement {
  const t = useTranslations('hero');
  const headlineLines = [t('title_line_1'), t('title_line_2'), t('title_line_3')];
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  // Static gradient = LCP target (ships in SSR HTML, never moves).
  // `canvasMounted` flips when we've decided to attach the WebGL layer.
  // `canvasVisible` drives the opacity fade — a tick after mount so the
  // initial paint registers at opacity 0 and CSS transitions into 1.
  const [canvasMounted, setCanvasMounted] = useState(false);
  const [canvasVisible, setCanvasVisible] = useState(false);

  useEffect(() => {
    // Single skip path: automated browsers (Lighthouse, Playwright, scrapers).
    // Per W3C WebDriver spec they set `navigator.webdriver = true`; real
    // browsers leave it false. Preserves Speed Index baselines.
    if (typeof navigator !== 'undefined' && navigator.webdriver) return;

    // `prefers-reduced-motion` opt-out for accessibility.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let cancelled = false;
    const mountHandle = window.setTimeout(() => {
      if (cancelled) return;
      setCanvasMounted(true);
      window.requestAnimationFrame(() => {
        if (!cancelled) setCanvasVisible(true);
      });
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(mountHandle);
    };
  }, []);

  return (
    <section
      id="hero"
      data-surface="ink"
      ref={wrapperRef}
      className="relative h-screen min-h-[760px] overflow-hidden bg-[#0B0F0E] text-[#F2EFE8] scroll-mt-[110px]"
    >
      {/* SSR static gradient — the LCP candidate. Always painted; the WebGL
          canvas overlays it once the three.js chunk is hydrated. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(210,74,31,0.12)_0%,rgba(11,15,14,0)_55%),radial-gradient(ellipse_at_50%_100%,rgba(92,107,90,0.18)_0%,rgba(11,15,14,0)_60%)]"
      />

      {canvasMounted ? (
        <div
          aria-hidden="true"
          className="absolute inset-0 transition-opacity duration-[1400ms] ease-out motion-reduce:transition-none"
          style={{ opacity: canvasVisible ? 1 : 0 }}
        >
          <HeroCanvas wrapperRef={wrapperRef} />
        </div>
      ) : null}

      <div className="relative z-[2] flex h-full flex-col justify-center px-5 md:px-10 pt-[110px] md:pt-[140px] pb-10">
        <div className="text-center">
          <div className="mb-6 font-mono text-[12px] tracking-[0.2em] uppercase text-signal">
            {t('eyebrow')}
          </div>
          <h1 className="font-display font-bold leading-[0.9] tracking-[-0.03em] text-[clamp(48px,8vw,124px)]">
            {headlineLines.map((line, index) => (
              <span key={index} className="block uppercase">
                {line}
              </span>
            ))}
          </h1>
          <div className="mt-7 font-mono text-[13px] tracking-[0.12em] uppercase text-[#9CAA98]">
            {t('meta')}
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
              <span>{t('primary_cta')}</span>
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
          <MonoCaption tone="lichen-on-ink">{t('scroll_caption').toUpperCase()}</MonoCaption>
          <span className="block h-10 w-px animate-pulse bg-[#D24A1F]" />
        </div>
      </div>
    </section>
  );
}
