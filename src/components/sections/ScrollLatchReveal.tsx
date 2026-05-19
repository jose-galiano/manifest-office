'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Eyebrow } from '@/components/ui/Eyebrow';
import { track } from '@/lib/analytics/track';
import { CUSTOM_EVENTS } from '@/lib/analytics/types';

import type { ReactElement } from 'react';

const FRAME_COUNT = 193;
const FRAME_BASE = '/scroll-video/anchor-latch';
const FRAME_PAD = 4;

type Beat = {
  readonly from: number;
  readonly to: number;
  readonly eyebrow: string;
  readonly title: string;
  readonly body: string;
};

const BEATS: readonly Beat[] = [
  {
    from: 1,
    to: 25,
    eyebrow: 'MO-A1 · ANCHOR LATCH',
    title: 'One part.',
    body: 'Brass, cold-forged in Porto. Hand-finished, lacquer-free.',
  },
  {
    from: 26,
    to: 60,
    eyebrow: 'GEOMETRY',
    title: 'One motion.',
    body: 'A quarter-turn closes the case. No springs, no plastic.',
  },
  {
    from: 61,
    to: 105,
    eyebrow: 'MECHANISM',
    title: 'Cam on a damped pivot.',
    body: 'O-ring tension keeps the slot screw seated through 2,400-mile rotations.',
  },
  {
    from: 106,
    to: 144,
    eyebrow: 'TOLERANCE',
    title: 'Slot screw. No hex key.',
    body: 'Field-serviceable with the blade of a coin.',
  },
  {
    from: 145,
    to: FRAME_COUNT,
    eyebrow: 'PROVENANCE',
    title: 'Twelve parts. Each named.',
    body: 'Every component carries a serial. Every component is replaceable.',
  },
];

function framePath(index: number): string {
  return `${FRAME_BASE}/${String(index).padStart(FRAME_PAD, '0')}.avif`;
}

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

export function ScrollLatchReveal(): ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const framesRef = useRef<HTMLImageElement[]>([]);
  const lastDrawnRef = useRef<number>(-1);
  const rafRef = useRef<number | null>(null);
  const inViewRef = useRef<boolean>(false);
  const viewFiredRef = useRef<boolean>(false);
  const completeFiredRef = useRef<boolean>(false);

  const [reducedMotion, setReducedMotion] = useState<boolean>(false);
  const [activeBeatIndex, setActiveBeatIndex] = useState<number>(0);
  const [ready, setReady] = useState<boolean>(false);

  const drawFrame = useCallback((frameIndex: number): void => {
    const canvas = canvasRef.current;
    const img = framesRef.current[frameIndex - 1];
    if (!canvas || !img || !img.complete || img.naturalWidth === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (canvas.width !== img.naturalWidth || canvas.height !== img.naturalHeight) {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
    }
    ctx.drawImage(img, 0, 0);
    lastDrawnRef.current = frameIndex;
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = (event: MediaQueryListEvent): void => setReducedMotion(event.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const images: HTMLImageElement[] = [];
    let loadedCount = 0;
    for (let i = 1; i <= FRAME_COUNT; i += 1) {
      const img = new Image();
      img.decoding = 'async';
      img.src = framePath(i);
      const onLoad = (): void => {
        loadedCount += 1;
        if (i === 1) {
          drawFrame(1);
          setReady(true);
        }
        if (loadedCount >= FRAME_COUNT) {
          drawFrame(lastDrawnRef.current > 0 ? lastDrawnRef.current : 1);
        }
      };
      img.addEventListener('load', onLoad, { once: true });
      images.push(img);
    }
    framesRef.current = images;
    return () => {
      framesRef.current = [];
    };
  }, [drawFrame]);

  useEffect(() => {
    if (reducedMotion) return;
    const container = containerRef.current;
    if (!container) return;

    const tick = (): void => {
      rafRef.current = null;
      if (!inViewRef.current) return;
      const rect = container.getBoundingClientRect();
      const viewport = window.innerHeight;
      const scrollable = rect.height - viewport;
      const progressed = scrollable > 0 ? -rect.top / scrollable : 0;
      const progress = clamp01(progressed);
      const target = Math.max(
        1,
        Math.min(FRAME_COUNT, Math.round(progress * (FRAME_COUNT - 1)) + 1),
      );
      if (target !== lastDrawnRef.current) {
        drawFrame(target);
        const beatIndex = BEATS.findIndex((beat) => target >= beat.from && target <= beat.to);
        if (beatIndex >= 0) setActiveBeatIndex(beatIndex);
        if (target >= FRAME_COUNT - 1 && !completeFiredRef.current) {
          completeFiredRef.current = true;
          track(CUSTOM_EVENTS.scrollVideoComplete, {
            params: { sequence: 'anchor-latch', frames: FRAME_COUNT },
          });
        }
      }
    };

    const onScroll = (): void => {
      if (rafRef.current !== null) return;
      rafRef.current = window.requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        inViewRef.current = entry.isIntersecting;
        if (entry.isIntersecting) {
          if (!viewFiredRef.current) {
            viewFiredRef.current = true;
            track(CUSTOM_EVENTS.scrollVideoView, {
              params: { sequence: 'anchor-latch', frames: FRAME_COUNT },
            });
          }
          onScroll();
        }
      },
      { threshold: 0 },
    );
    io.observe(container);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [drawFrame, reducedMotion]);

  useEffect(() => {
    if (!reducedMotion) return;
    drawFrame(FRAME_COUNT);
    setActiveBeatIndex(BEATS.length - 1);
  }, [drawFrame, reducedMotion]);

  const activeBeat = useMemo(() => BEATS[activeBeatIndex] ?? BEATS[0], [activeBeatIndex]) as Beat;

  return (
    <section
      id="anchor-story"
      ref={containerRef}
      data-section="scroll-latch-reveal"
      className="relative scroll-mt-[110px] bg-[#0B0F0E] text-[#F2EFE8]"
      style={{ height: reducedMotion ? 'auto' : '420vh' }}
    >
      <div
        className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden"
        style={{ position: reducedMotion ? 'relative' : 'sticky' }}
      >
        <canvas
          ref={canvasRef}
          aria-label="Anchor Latch — exploded mechanism reveal"
          role="img"
          className="absolute inset-0 h-full w-full object-cover opacity-95"
          style={{
            transition: 'opacity 600ms ease',
            opacity: ready ? 0.95 : 0,
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 30% 50%, rgba(11,15,14,0.0) 0%, rgba(11,15,14,0.55) 65%, rgba(11,15,14,0.85) 100%)',
          }}
        />

        <div className="relative z-10 mx-auto grid w-full max-w-[1400px] grid-cols-1 items-end gap-10 px-5 pb-16 md:grid-cols-12 md:px-10 md:pb-24">
          <div className="md:col-span-5">
            <Eyebrow className="mb-5 block text-signal">{activeBeat.eyebrow}</Eyebrow>
            <h2
              key={`title-${activeBeatIndex}`}
              className="font-display text-[clamp(40px,5.5vw,76px)] font-bold leading-[1] tracking-[-0.02em]"
              style={{ animation: 'mo-beat-in 600ms cubic-bezier(0.22,1,0.36,1) both' }}
            >
              {activeBeat.title}
            </h2>
            <p
              key={`body-${activeBeatIndex}`}
              className="mt-5 max-w-[44ch] text-[15px] leading-[1.55] text-[#F2EFE8]/80"
              style={{ animation: 'mo-beat-in 700ms 80ms cubic-bezier(0.22,1,0.36,1) both' }}
            >
              {activeBeat.body}
            </p>
          </div>

          <div className="hidden md:col-span-7 md:flex md:justify-end">
            <ol className="flex gap-2">
              {BEATS.map((beat, index) => (
                <li
                  key={beat.eyebrow}
                  aria-current={index === activeBeatIndex ? 'true' : undefined}
                  className="h-[2px] w-[44px] transition-colors duration-300"
                  style={{
                    backgroundColor:
                      index <= activeBeatIndex
                        ? 'var(--color-signal, #D24A1F)'
                        : 'rgba(242,239,232,0.22)',
                  }}
                />
              ))}
            </ol>
          </div>
        </div>

        <span className="absolute right-5 top-5 z-10 font-mono text-[10px] uppercase tracking-[0.12em] text-[#F2EFE8]/55 md:right-10 md:top-10">
          Filed · MO-A1 · 12 parts
        </span>
      </div>

      <style>{`
        @keyframes mo-beat-in {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
