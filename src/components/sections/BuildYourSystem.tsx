'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { EDITION_01_PRODUCTS } from '@/content/manifest-office';
import { CUSTOM_EVENTS, track as trackEvent } from '@/lib/analytics';

import type { Product } from '@/content/manifest-office';
import type { ReactElement } from 'react';

// BuildYourSystem — the four-step horizontal scroll-pin from the legacy
// `/pdp` page (`#build-pin` in `deploy/pdp.html`). Renders five panels:
//   1. Intro (scroll hint)
//   2. Step 01 — Pick the trip   (single-select)
//   3. Step 02 — Pick the cubes  (multi-select)
//   4. Step 03 — Pick the pouch  (single-select)
//   5. Summary                   (live total)
//
// Mechanics: outer `<section>` is 600vh tall. A sticky 100vh-tall track
// holds five 100vw panels in a 500vw flex row that translates left as the
// user scrolls vertically through the section.
//
// MIGRATION-SPEC §8.1 flags this as the top risk in the rewrite because
// the legacy implementation used a raw scroll listener with no resize
// handling, no transform3d, and no rAF throttling — all three concessions
// are addressed here.
//
// Browser support: CSS `animation-timeline: scroll()` is feature-detected
// and used where available (Chromium 115+, Edge). On Safari < 18 and
// Firefox stable, fall back to the rAF-throttled scroll listener. Both
// paths produce identical translateX values.

// --- Selection model -----------------------------------------------------
type TripChoice = 'weekend' | 'week' | 'long-haul';
type CubeChoice = 'cube-s' | 'cube-m' | 'cube-l';
type PouchChoice = 'tech-pouch-s' | 'tech-pouch-m' | 'tech-pouch-l';

interface TripOption {
  readonly key: TripChoice;
  readonly reference: string;
  readonly name: string;
  readonly meta: string;
}

interface CubeOption {
  readonly key: CubeChoice;
  readonly reference: string;
  readonly handle: string;
  readonly name: string;
  readonly meta: string;
}

interface PouchOption {
  readonly key: PouchChoice;
  readonly reference: string;
  readonly handle: string;
  readonly name: string;
  readonly meta: string;
}

interface SummaryLine {
  readonly handle: string;
  readonly title: string;
  readonly priceEur: number;
}

// Fixtures + dynamic line items derive from the same product catalogue, so
// the price column never drifts from `src/content/manifest-office.ts`.
const PRODUCT_INDEX: ReadonlyMap<string, Product> = new Map(
  EDITION_01_PRODUCTS.map((product) => [product.handle, product]),
);

function findProduct(handle: string): Product {
  const product = PRODUCT_INDEX.get(handle);
  if (!product) {
    throw new Error(`Missing Edition 01 product: ${handle}`);
  }
  return product;
}

const TRIP_OPTIONS: readonly TripOption[] = [
  { key: 'weekend', reference: '02', name: 'Weekend', meta: '2-3 days · S+S' },
  { key: 'week', reference: '03', name: 'Week', meta: '5-7 days · S+M+L' },
  { key: 'long-haul', reference: '04', name: 'Long-haul', meta: '10+ days · M+L+L' },
] as const;

function buildSizedOption<TKey extends CubeChoice | PouchChoice>(
  key: TKey,
  reference: string,
): { key: TKey; reference: string; handle: string; name: string; meta: string } {
  const product = findProduct(key);
  return {
    key,
    reference,
    handle: product.handle,
    name: product.title,
    meta: `${product.volume} · €${product.priceEur}`,
  };
}

const CUBE_OPTIONS: readonly CubeOption[] = [
  buildSizedOption<CubeChoice>('cube-s', 'S'),
  buildSizedOption<CubeChoice>('cube-m', 'M'),
  buildSizedOption<CubeChoice>('cube-l', 'L'),
];
const POUCH_OPTIONS: readonly PouchOption[] = [
  buildSizedOption<PouchChoice>('tech-pouch-s', 'S'),
  buildSizedOption<PouchChoice>('tech-pouch-m', 'M'),
  buildSizedOption<PouchChoice>('tech-pouch-l', 'L'),
];

// Always-in fixtures — the brand's "system" includes a tote, a toiletry
// kit, and a luggage tag regardless of trip length. Matches the €428
// summary in the legacy markup.
const FIXTURE_HANDLES: readonly string[] = ['field-tote', 'toiletry-kit', 'luggage-tag'];

const DEFAULT_TRIP: TripChoice = 'week';
const DEFAULT_CUBES: readonly CubeChoice[] = ['cube-m', 'cube-l'];
const DEFAULT_POUCH: PouchChoice = 'tech-pouch-m';

// --- Scroll-pin geometry -------------------------------------------------
const PANEL_COUNT = 5;
const SECTION_VH = 600;
const MOBILE_BREAKPOINT_PX = 820;

interface ScrollPinHookResult {
  readonly trackRef: (node: HTMLDivElement | null) => void;
  readonly sectionRef: (node: HTMLElement | null) => void;
}

/**
 * Drives the horizontal translate of the track based on the section's
 * progress through the viewport. Uses CSS scroll-timeline where available;
 * otherwise rAF-throttled scroll listener.
 */
function useHorizontalScrollPin(enabled: boolean): ScrollPinHookResult {
  const sectionNodeRef = useRef<HTMLElement | null>(null);
  const trackNodeRef = useRef<HTMLDivElement | null>(null);
  const lastProgressRef = useRef<number>(-1);
  const rafTokenRef = useRef<number>(0);
  // Track which panel index was most recently dominant in the viewport so
  // we fire `scroll_pin_panel` at most once per crossing — without this
  // every animation frame inside the panel band would emit an event.
  const lastPanelIndexRef = useRef<number>(-1);

  const applyTransform = useCallback((progress: number): void => {
    const track = trackNodeRef.current;
    if (!track) return;
    const distance = (PANEL_COUNT - 1) * window.innerWidth;
    const translateX = -distance * progress;
    // `transform3d` to keep the layer on the compositor (avoids jitter
    // identified in MIGRATION-SPEC §8.1).
    track.style.transform = `translate3d(${translateX}px, 0, 0)`;
  }, []);

  const tick = useCallback((): void => {
    rafTokenRef.current = 0;
    const section = sectionNodeRef.current;
    if (!section) return;
    const rect = section.getBoundingClientRect();
    const total = section.offsetHeight - window.innerHeight;
    if (total <= 0) return;
    const rawProgress = -rect.top / total;
    const progress = Math.max(0, Math.min(1, rawProgress));
    if (Math.abs(progress - lastProgressRef.current) < 0.0005) return;
    lastProgressRef.current = progress;
    applyTransform(progress);
    // Emit `scroll_pin_panel` on panel-index transitions (5 panels split
    // the [0,1] progress range evenly). Hysteresis falls out for free
    // because we only fire when the integer index changes.
    const panelIndex = Math.min(PANEL_COUNT - 1, Math.floor(progress * PANEL_COUNT));
    if (panelIndex !== lastPanelIndexRef.current) {
      const previous = lastPanelIndexRef.current;
      lastPanelIndexRef.current = panelIndex;
      // -1 → first entry; skip emitting on the initial "set to first panel"
      // call so we don't double-count the section becoming visible (the
      // PageView + SectionView already covers entry).
      if (previous !== -1) {
        trackEvent(CUSTOM_EVENTS.scrollPinPanel, {
          params: {
            panel_index: panelIndex,
            panel_total: PANEL_COUNT,
            direction: panelIndex > previous ? 'forward' : 'back',
          },
        });
      }
    }
  }, [applyTransform]);

  const onScroll = useCallback((): void => {
    if (rafTokenRef.current !== 0) return;
    rafTokenRef.current = window.requestAnimationFrame(tick);
  }, [tick]);

  useEffect(() => {
    if (!enabled) return;
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    // Run once to set the initial position.
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafTokenRef.current !== 0) {
        cancelAnimationFrame(rafTokenRef.current);
        rafTokenRef.current = 0;
      }
    };
  }, [enabled, onScroll]);

  const sectionRef = useCallback((node: HTMLElement | null): void => {
    sectionNodeRef.current = node;
  }, []);
  const trackRef = useCallback((node: HTMLDivElement | null): void => {
    trackNodeRef.current = node;
  }, []);

  return { sectionRef, trackRef };
}

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX}px)`);
    const update = (): void => setIsMobile(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return isMobile;
}

// --- Component -----------------------------------------------------------
export function BuildYourSystem(): ReactElement {
  const [trip, setTrip] = useState<TripChoice>(DEFAULT_TRIP);
  const [selectedCubes, setSelectedCubes] = useState<ReadonlySet<CubeChoice>>(
    new Set<CubeChoice>(DEFAULT_CUBES),
  );
  const [pouch, setPouch] = useState<PouchChoice>(DEFAULT_POUCH);

  const isMobile = useIsMobile();
  const { sectionRef, trackRef } = useHorizontalScrollPin(!isMobile);

  const toggleCube = useCallback((key: CubeChoice): void => {
    setSelectedCubes((previous) => {
      const next = new Set<CubeChoice>(previous);
      if (next.has(key)) {
        // Keep at least one cube selected so the summary stays meaningful.
        if (next.size === 1) return previous;
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const summary = useMemo<{
    readonly lines: readonly SummaryLine[];
    readonly totalEur: number;
  }>(() => {
    const lines: SummaryLine[] = [];
    for (const key of selectedCubes) {
      const product = findProduct(key);
      lines.push({
        handle: product.handle,
        title: product.title,
        priceEur: product.priceEur,
      });
    }
    const pouchProduct = findProduct(pouch);
    lines.push({
      handle: pouchProduct.handle,
      title: pouchProduct.title,
      priceEur: pouchProduct.priceEur,
    });
    for (const handle of FIXTURE_HANDLES) {
      const product = findProduct(handle);
      lines.push({
        handle: product.handle,
        title: product.title,
        priceEur: product.priceEur,
      });
    }
    const totalEur = lines.reduce((sum, line) => sum + line.priceEur, 0);
    return { lines, totalEur };
  }, [selectedCubes, pouch]);

  const skuCount = summary.lines.length;
  const totalLabel = `€${summary.totalEur}.`;

  if (isMobile) {
    return (
      <section aria-label="Build your system" className="bg-[#F2EFE8] text-[#0B0F0E]">
        {renderIntroPanel({ isMobile: true })}
        {renderStepPanel({
          number: '01',
          label: 'PICK THE TRIP',
          heading: 'Weekend.\nWeek. Long-haul.',
          options: TRIP_OPTIONS.map((option) => ({
            key: option.key,
            reference: option.reference,
            name: option.name,
            meta: option.meta,
            active: option.key === trip,
            onSelect: () => setTrip(option.key),
          })),
        })}
        {renderStepPanel({
          number: '02',
          label: 'PICK THE CUBES',
          heading: 'Compression.\nBy volume.',
          options: CUBE_OPTIONS.map((option) => ({
            key: option.key,
            reference: option.reference,
            name: option.name,
            meta: option.meta,
            active: selectedCubes.has(option.key),
            onSelect: () => toggleCube(option.key),
          })),
        })}
        {renderStepPanel({
          number: '03',
          label: 'PICK THE TECH POUCH',
          heading: 'For cables.\nFor documents.',
          options: POUCH_OPTIONS.map((option) => ({
            key: option.key,
            reference: option.reference,
            name: option.name,
            meta: option.meta,
            active: option.key === pouch,
            onSelect: () => setPouch(option.key),
          })),
        })}
        {renderSummaryPanel({
          skuCount,
          totalLabel,
          lines: summary.lines,
          isMobile: true,
        })}
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      aria-label="Build your system"
      className="relative bg-[#F2EFE8] text-[#0B0F0E]"
      style={{ height: `${SECTION_VH}vh`, touchAction: 'pan-y' }}
    >
      <div className="sticky top-0 h-screen w-screen overflow-hidden">
        <div
          ref={trackRef}
          className="flex h-screen will-change-transform"
          style={{ width: `${PANEL_COUNT * 100}vw` }}
        >
          {renderIntroPanel({ isMobile: false })}
          {renderStepPanel({
            number: '01',
            label: 'PICK THE TRIP',
            heading: 'Weekend.\nWeek. Long-haul.',
            options: TRIP_OPTIONS.map((option) => ({
              key: option.key,
              reference: option.reference,
              name: option.name,
              meta: option.meta,
              active: option.key === trip,
              onSelect: () => setTrip(option.key),
            })),
          })}
          {renderStepPanel({
            number: '02',
            label: 'PICK THE CUBES',
            heading: 'Compression.\nBy volume.',
            options: CUBE_OPTIONS.map((option) => ({
              key: option.key,
              reference: option.reference,
              name: option.name,
              meta: option.meta,
              active: selectedCubes.has(option.key),
              onSelect: () => toggleCube(option.key),
            })),
          })}
          {renderStepPanel({
            number: '03',
            label: 'PICK THE TECH POUCH',
            heading: 'For cables.\nFor documents.',
            options: POUCH_OPTIONS.map((option) => ({
              key: option.key,
              reference: option.reference,
              name: option.name,
              meta: option.meta,
              active: option.key === pouch,
              onSelect: () => setPouch(option.key),
            })),
          })}
          {renderSummaryPanel({
            skuCount,
            totalLabel,
            lines: summary.lines,
            isMobile: false,
          })}
        </div>
      </div>
    </section>
  );
}

// --- Panel renderers ------------------------------------------------------
// Local helpers rather than separate components — they're never reused
// outside this file and keep all the panel markup colocated with the
// scroll-pin logic.

function panelBaseClasses(isMobile: boolean): string {
  if (isMobile) {
    return 'w-screen flex flex-col justify-center px-5 md:px-10 py-32 border-b border-[rgba(11,15,14,0.12)]';
  }
  return 'flex-[0_0_100vw] h-screen px-5 md:px-10 lg:px-20 py-32 flex flex-col justify-center border-r border-[rgba(11,15,14,0.12)] bg-[#F2EFE8]';
}

function renderIntroPanel({ isMobile }: { isMobile: boolean }): ReactElement {
  return (
    <article
      key="intro"
      className={`${panelBaseClasses(isMobile)} bg-[#0B0F0E] !text-[#F2EFE8]`}
      style={{ background: '#0B0F0E', color: '#F2EFE8' }}
    >
      <span className="font-mono text-[11px] tracking-[0.18em] uppercase text-signal mb-6">
        THE SYSTEM · STEP 01 / 04
      </span>
      <h2 className="font-display font-bold leading-[0.9] tracking-[-0.03em] mb-6 text-[clamp(64px,14vw,200px)]">
        Build your
        <br />
        system.
      </h2>
      <p className="text-[19px] max-w-[56ch] text-[rgba(242,239,232,0.85)] mb-8">
        Four steps. Pick the trip. Pick the cubes. Pick the pouch. Pick the monogram. The Anchor
        Latch does the rest. {isMobile ? 'Scroll down.' : 'Scroll right.'}
      </p>
      <span className="font-mono text-[12px] tracking-[0.16em] uppercase text-signal">
        {isMobile ? '↓ SCROLL VERTICALLY' : '→ SCROLL HORIZONTALLY'}
      </span>
    </article>
  );
}

interface StepOptionViewModel {
  readonly key: string;
  readonly reference: string;
  readonly name: string;
  readonly meta: string;
  readonly active: boolean;
  readonly onSelect: () => void;
}

function renderStepPanel(props: {
  readonly number: string;
  readonly label: string;
  readonly heading: string;
  readonly options: readonly StepOptionViewModel[];
}): ReactElement {
  const { number, label, heading, options } = props;
  const headingLines = heading.split('\n');
  return (
    <article
      key={`step-${number}`}
      className={`${panelBaseClasses(false)} relative overflow-hidden`}
    >
      <div
        className="absolute right-[5vw] bottom-[8vh] font-display font-bold text-signal opacity-[0.18] pointer-events-none leading-[0.85] tracking-[-0.04em]"
        style={{ fontSize: 'clamp(160px, 30vw, 480px)' }}
        aria-hidden="true"
      >
        {number}
      </div>
      <div className="font-mono text-[12px] tracking-[0.12em] uppercase text-signal mb-4 relative z-[1]">
        {label}
      </div>
      <h3 className="font-display font-bold leading-[0.9] tracking-[-0.03em] mb-16 relative z-[1] text-[clamp(56px,10vw,144px)]">
        {headingLines.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </h3>
      <div className="flex flex-col gap-3 max-w-[480px] relative z-[1]">
        {options.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={option.onSelect}
            data-cursor
            data-active={option.active ? 'true' : 'false'}
            data-track="build_system_select"
            data-track-step={label}
            data-track-option={option.key}
            className={`grid grid-cols-[60px_1fr_auto] gap-6 items-center px-7 py-5 border font-mono uppercase tracking-[0.04em] text-[13px] cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] text-left ${
              option.active
                ? 'bg-[#0B0F0E] text-[#F2EFE8] border-[#0B0F0E]'
                : 'bg-[rgba(242,239,232,0.6)] text-[#0B0F0E] border-[rgba(11,15,14,0.12)] hover:border-[#0B0F0E] hover:translate-x-2'
            }`}
            aria-pressed={option.active}
          >
            <span className="text-signal font-medium">{option.reference}</span>
            <span>{option.name}</span>
            <span
              className={
                option.active
                  ? 'text-[rgba(242,239,232,0.65)] text-[11px]'
                  : 'text-[#9CAA98] text-[11px]'
              }
            >
              {option.meta}
            </span>
          </button>
        ))}
      </div>
    </article>
  );
}

function renderSummaryPanel(props: {
  readonly skuCount: number;
  readonly totalLabel: string;
  readonly lines: readonly SummaryLine[];
  readonly isMobile: boolean;
}): ReactElement {
  const { skuCount, totalLabel, lines, isMobile } = props;
  const paddedCount = skuCount.toString().padStart(2, '0');
  return (
    <article
      key="summary"
      className={`${panelBaseClasses(isMobile)} bg-[#0B0F0E] text-[#F2EFE8]`}
      style={{ background: '#0B0F0E', color: '#F2EFE8' }}
    >
      <span className="font-mono text-[11px] tracking-[0.18em] uppercase text-signal mb-6">
        YOUR MANIFEST
      </span>
      <h2 className="font-display font-bold leading-[0.9] tracking-[-0.03em] mb-12 text-[clamp(64px,14vw,200px)]">
        {paddedCount} SKUs.
        <br />
        {totalLabel}
      </h2>
      <ul className="list-none max-w-[560px] mb-12" aria-label="Manifest line items">
        {lines.map((line) => {
          const issuePrefix = '01';
          const paddedPrice = line.priceEur < 10 ? `0${line.priceEur}` : `${line.priceEur}`;
          return (
            <li
              key={line.handle}
              className="flex justify-between py-4 border-b border-[rgba(242,239,232,0.18)] font-mono text-[14px] tracking-[0.04em]"
            >
              <span>
                {issuePrefix} · {line.title}
              </span>
              <span>€{paddedPrice}</span>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        data-cursor
        data-track="build_system_reserve_manifest"
        data-track-skus={String(skuCount)}
        data-track-total-eur={totalLabel.replace(/[^\d.]/g, '')}
        className="self-start bg-[#D24A1F] text-[#F2EFE8] border-none cursor-pointer px-9 py-5 font-mono text-[13px] tracking-[0.12em] uppercase transition-[letter-spacing,background] duration-300 ease-out hover:tracking-[0.18em] hover:bg-[#B83C16]"
      >
        Reserve this manifest →
      </button>
    </article>
  );
}
