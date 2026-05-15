/**
 * `<HorizontalScroll />` — generic horizontal scroll-snap rail.
 *
 * Wraps children in a `scroll-snap-x mandatory` flex row, hides the native
 * scrollbar, exposes two arrow buttons on desktop (`hidden md:flex`) that
 * advance the rail by ~80% of its visible width. On touch devices the user
 * just swipes — the arrows are still keyboard-accessible via Tab.
 *
 * Brand-bible §11: motion decelerates on every state change. The arrow
 * advance uses `scrollBy({ behavior: 'smooth' })` which the browser already
 * tweens with native easing. `prefers-reduced-motion` is honoured by passing
 * `behavior: 'auto'` so the rail snaps instantly without animation.
 *
 * Layer separation:
 *  - No data — pure presentation. Each section owns its own item rendering.
 *  - No external deps (no Embla, no Swiper).
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { ReactElement, ReactNode } from 'react';

export interface HorizontalScrollProps {
  readonly children: ReactNode;
  /** Accessible label for the rail (e.g. "Operator notes"). */
  readonly ariaLabel: string;
  /** Tone of the chrome — `paper` on light backgrounds, `ink` on dark. */
  readonly tone?: 'paper' | 'ink';
  /** Hide the arrow chrome entirely. Touch-first sections that don't need it. */
  readonly hideArrows?: boolean;
  /** Extra classes on the scrolling rail (e.g. left padding for first-item). */
  readonly className?: string;
}

export function HorizontalScroll({
  children,
  ariaLabel,
  tone = 'paper',
  hideArrows = false,
  className = '',
}: HorizontalScrollProps): ReactElement {
  const railRef = useRef<HTMLDivElement | null>(null);
  const [atStart, setAtStart] = useState<boolean>(true);
  const [atEnd, setAtEnd] = useState<boolean>(false);

  const updateBounds = useCallback((): void => {
    const rail = railRef.current;
    if (!rail) return;
    setAtStart(rail.scrollLeft <= 4);
    setAtEnd(rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    updateBounds();
    rail.addEventListener('scroll', updateBounds, { passive: true });
    window.addEventListener('resize', updateBounds);
    return () => {
      rail.removeEventListener('scroll', updateBounds);
      window.removeEventListener('resize', updateBounds);
    };
  }, [updateBounds]);

  const reducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const advance = useCallback(
    (direction: 1 | -1): void => {
      const rail = railRef.current;
      if (!rail) return;
      const step = Math.round(rail.clientWidth * 0.8);
      rail.scrollBy({ left: direction * step, behavior: reducedMotion ? 'auto' : 'smooth' });
    },
    [reducedMotion],
  );

  const isInk = tone === 'ink';
  const arrowBase =
    'hidden md:flex h-11 w-11 items-center justify-center rounded-full border transition-[opacity,background-color,color] duration-200 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';
  const arrowTone = isInk
    ? 'border-[rgba(242,239,232,0.28)] text-[var(--color-paper)] hover:bg-[var(--color-signal)] hover:border-[var(--color-signal)] focus-visible:ring-[var(--color-paper)] focus-visible:ring-offset-[#0B0F0E]'
    : 'border-[rgba(11,15,14,0.35)] text-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)] focus-visible:ring-[var(--color-ink)] focus-visible:ring-offset-[#F2EFE8]';

  return (
    <div className="relative">
      <div
        ref={railRef}
        role="region"
        aria-label={ariaLabel}
        className={[
          'flex gap-5 overflow-x-auto overflow-y-hidden snap-x snap-mandatory',
          'scroll-smooth no-scrollbar',
          'pb-4', // room for any focus rings on the items
          className,
        ].join(' ')}
      >
        {children}
      </div>

      {!hideArrows ? (
        <div className="mt-6 hidden md:flex items-center gap-3">
          <button
            type="button"
            aria-label="Previous"
            onClick={() => advance(-1)}
            disabled={atStart}
            className={`${arrowBase} ${arrowTone} disabled:opacity-25 disabled:cursor-not-allowed`}
          >
            <span aria-hidden="true">←</span>
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={() => advance(1)}
            disabled={atEnd}
            className={`${arrowBase} ${arrowTone} disabled:opacity-25 disabled:cursor-not-allowed`}
          >
            <span aria-hidden="true">→</span>
          </button>
        </div>
      ) : null}

      <style>{`
        .no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
