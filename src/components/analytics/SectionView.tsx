/**
 * Wraps a content section with an IntersectionObserver that fires
 * `section_view` when the section first enters viewport and `section_dwell`
 * with the dwell-time when it leaves.
 *
 * Drop in around any section the team wants to measure:
 *   <SectionView name="hero_3d"> ...existing JSX... </SectionView>
 *
 * Threshold defaults to 0.35 — enough that a passing scroll-by doesn't
 * count, low enough that tall sections register on first frame.
 */

'use client';

import { useEffect, useRef } from 'react';

import { CUSTOM_EVENTS, track } from '@/lib/analytics';

import type { ReactElement, ReactNode } from 'react';

export type SectionViewProps = {
  name: string;
  /** Override the visibility threshold (0–1). */
  threshold?: number;
  /** Fire a single `section_view` per page load (default) or every entry. */
  once?: boolean;
  className?: string;
  children: ReactNode;
};

export function SectionView({
  name,
  threshold = 0.35,
  once = true,
  className,
  children,
}: SectionViewProps): ReactElement {
  const ref = useRef<HTMLDivElement | null>(null);
  const hasFiredRef = useRef(false);
  const enteredAtRef = useRef<number | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (once && hasFiredRef.current) continue;
            hasFiredRef.current = true;
            enteredAtRef.current = performance.now();
            track(CUSTOM_EVENTS.sectionView, {
              params: {
                section_name: name,
                intersection_ratio: Number(entry.intersectionRatio.toFixed(2)),
              },
            });
          } else if (enteredAtRef.current !== null) {
            const dwellMs = Math.round(performance.now() - enteredAtRef.current);
            enteredAtRef.current = null;
            // Drop noisy <1s dwells; they're usually fast scrolls past.
            if (dwellMs >= 1000) {
              track(CUSTOM_EVENTS.sectionDwell, {
                params: { section_name: name, dwell_ms: dwellMs },
              });
            }
          }
        }
      },
      { threshold },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [name, threshold, once]);

  return (
    <div ref={ref} data-section={name} className={className}>
      {children}
    </div>
  );
}
