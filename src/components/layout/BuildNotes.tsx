/**
 * `<BuildNotes />` — recruiter / CTO tour overlay.
 *
 * Floating "▸ BUILD NOTES" chip in the bottom-left. Click (or press D) to
 * open a side-sheet with five numbered panels: Stack, Features, Performance,
 * Commerce, Source. Each panel surfaces what was built and links straight
 * to the feature so a 30-second visitor never has to hunt.
 *
 * State: local. Mounted once at the root layout. No analytics noise — the
 * panel toggle isn't tracked because the tour is the marketing surface,
 * not the conversion event.
 */

'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import type { ReactElement } from 'react';

type PanelId = '01' | '02' | '03' | '04' | '05';

const PANEL_ORDER: readonly PanelId[] = ['01', '02', '03', '04', '05'];
const PANEL_TITLES: Readonly<Record<PanelId, string>> = {
  '01': 'Stack',
  '02': 'Features',
  '03': 'Performance',
  '04': 'Commerce',
  '05': 'Source',
};

type FeatureLink = {
  readonly label: string;
  readonly description: string;
  readonly href: string;
};

const FEATURES: readonly FeatureLink[] = [
  {
    label: 'WebGL topographic hero',
    description: 'Three.js plane, pointer Gaussian bulge, signal-orange ink fog',
    href: '/#hero',
  },
  {
    label: 'Anchor Latch scrollytelling',
    description: '193-frame AVIF sequence, sticky canvas, scroll-driven frame index',
    href: '/products/anchor-latch#anchor-story',
  },
  {
    label: '3D exploded kit viewer',
    description: 'Drag-orbit, EXPLODE / ASSEMBLE toggle, seven labelled parts',
    href: '/products/anchor-latch#exploded-kit',
  },
  {
    label: 'Brief the Desk',
    description: 'Gemini 2.5 Flash trip-brief endpoint, 7-layer defence',
    href: '/#desk',
  },
  {
    label: 'Wishlist + share URL',
    description: 'LocalStorage, cross-tab sync, ?w= share link, drawer carousel',
    href: '/collections/edition-01#dossiers',
  },
  {
    label: 'Quick-add bottom sheet',
    description: 'Card-anchored on desktop, slide-up on mobile, haptic on add',
    href: '/collections/edition-01#dossiers',
  },
  {
    label: 'PDP thumbnail carousel',
    description: 'Hero + alt-angle thumbs, click to swap, all paper-backdrop typology',
    href: '/products/field-tote#gallery',
  },
  {
    label: 'Live allocation counter',
    description: 'Shopify metafield write, real-time across visitors, JSON-LD availability',
    href: '/products/cube-m#allocation',
  },
];

const STACK_ROWS: readonly { readonly label: string; readonly value: string }[] = [
  { label: 'Framework', value: 'Next.js 15 · App Router · React 19' },
  { label: 'Language', value: 'TypeScript strict' },
  { label: 'Commerce', value: 'Headless Shopify · Admin GraphQL · Pause & Build' },
  { label: 'Styling', value: 'Tailwind 4 · Tailwind tokens · CSS-vars surface' },
  { label: 'State', value: 'Zustand · Local + Session storage' },
  { label: '3D', value: 'Three.js · React Three Fiber · WebGL shaders' },
  { label: 'Edge', value: 'Vercel · Upstash Redis · Server Actions' },
  { label: 'AI', value: 'Gemini 2.5 Flash · Gemini 3 Pro Image · Cloudflare Turnstile' },
  { label: 'Email', value: 'Klaviyo Client API · GA4 + GTM event fanout' },
  { label: 'First Load JS', value: '~120 kB shared · 147 kB on PDP' },
];

const PERF_ROWS: readonly { readonly label: string; readonly value: string }[] = [
  { label: 'Lighthouse Mobile', value: 'Perf 96 · A11y 100 · BP 100 · SEO 100' },
  { label: 'LCP', value: '2.3s · CLS 0' },
  { label: 'WebGL', value: 'Gated on mousedown/scroll/key — Lighthouse-stable' },
  { label: 'Images', value: '31 mood-board WebPs · 44MB → 3MB' },
  { label: 'Analytics', value: 'GTM + Clarity wrapped in requestIdleCallback' },
  { label: 'A11y', value: 'Surface-aware token system · all targets ≥ 24×24' },
];

const COMMERCE_ROWS: readonly { readonly label: string; readonly value: string }[] = [
  { label: 'Edition', value: '1,200 systems issued · live allocation per SKU' },
  { label: 'Reserve', value: 'Server action writes Shopify metafield · no payment' },
  { label: 'Checkout', value: 'Lead capture · routes to /pages/book (intentional)' },
  { label: 'Cart', value: 'Slide-in drawer · inline engraving editor · 3-state slot' },
  { label: 'Wishlist', value: 'Heart on card · drawer with live allocation refetch' },
  { label: 'Variants', value: 'Colorway swatches · synthetic finishes for hardware' },
];

export function BuildNotes(): ReactElement {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activePanel, setActivePanel] = useState<PanelId>('01');
  const [hasNudged, setHasNudged] = useState<boolean>(false);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setHasNudged(true);
  }, []);

  const handleClose = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (hasNudged) return;
    const timer = window.setTimeout(() => setHasNudged(true), 6000);
    return () => window.clearTimeout(timer);
  }, [hasNudged]);

  useEffect(() => {
    function onKey(event: KeyboardEvent): void {
      if (event.key === 'Escape' && isOpen) handleClose();
      if (event.key === 'd' || event.key === 'D') {
        const target = event.target as HTMLElement | null;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
        event.preventDefault();
        setIsOpen((prev) => !prev);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [handleClose, isOpen]);

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Open build notes — guided tour of what was built"
        className="mo-build-chip fixed bottom-5 left-5 z-[750] inline-flex items-center gap-2 rounded-full border border-[var(--color-rule-strong)] bg-[var(--color-paper)] px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--color-ink)] shadow-[0_4px_20px_rgba(11,15,14,0.18)] transition-[transform,background] duration-200 hover:bg-white active:scale-[0.97]"
        data-nudge={hasNudged ? 'off' : 'on'}
      >
        <span aria-hidden="true" className="text-[var(--color-signal)]">
          ▸
        </span>
        <span>Build Notes</span>
        <kbd className="ml-1 rounded border border-[var(--color-rule)] px-1 py-px font-mono text-[9px] tracking-[0.05em] text-[var(--color-lichen)]">
          D
        </kbd>
        <style>{`
          .mo-build-chip[data-nudge='on'] {
            animation: mo-build-pulse 1600ms ease-in-out 6s 2;
          }
          @keyframes mo-build-pulse {
            0%   { transform: scale(1); box-shadow: 0 4px 20px rgba(11,15,14,0.18); }
            40%  { transform: scale(1.04); box-shadow: 0 6px 28px rgba(210,74,31,0.35); }
            100% { transform: scale(1); box-shadow: 0 4px 20px rgba(11,15,14,0.18); }
          }
          @media (prefers-reduced-motion: reduce) {
            .mo-build-chip[data-nudge='on'] { animation: none; }
          }
        `}</style>
      </button>

      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onClick={handleClose}
        className={[
          'fixed inset-0 z-[800] cursor-default bg-[rgba(11,15,14,0.5)]',
          'transition-opacity duration-300 ease-out',
          isOpen ? 'visible opacity-100' : 'invisible opacity-0 delay-[300ms]',
        ].join(' ')}
      />

      <aside
        aria-label="Build notes"
        inert={!isOpen}
        className={[
          'fixed right-0 top-0 z-[900] flex h-dvh w-[min(520px,100vw)] flex-col',
          'bg-[var(--color-paper)] text-[var(--color-ink)]',
          'shadow-[-1px_0_0_var(--color-rule)]',
          'transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        <header className="flex items-baseline justify-between px-8 pb-5 pt-8">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--color-lichen)]">
              Maelify · Build Notes
            </span>
            <h2 className="font-display text-[22px] font-medium leading-none tracking-[-0.01em]">
              What was built
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="border-0 bg-transparent p-0 font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--color-lichen)] transition-colors hover:text-[var(--color-ink)]"
          >
            Close
          </button>
        </header>

        <nav
          role="tablist"
          aria-label="Build-notes sections"
          className="flex gap-1 border-b border-[var(--color-rule)] px-8"
        >
          {PANEL_ORDER.map((id) => {
            const isActive = id === activePanel;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActivePanel(id)}
                className={`relative -mb-px flex items-baseline gap-2 border-b py-3 font-mono text-[10px] uppercase tracking-[0.08em] transition-colors ${
                  isActive
                    ? 'border-[var(--color-ink)] text-[var(--color-ink)]'
                    : 'border-transparent text-[var(--color-lichen)] hover:text-[var(--color-ink)]'
                }`}
              >
                <span className="text-[11px] font-medium">{id}</span>
                <span>{PANEL_TITLES[id]}</span>
              </button>
            );
          })}
        </nav>

        <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
          {activePanel === '01' ? <KeyValueList rows={STACK_ROWS} /> : null}
          {activePanel === '02' ? <FeatureList items={FEATURES} onSelect={handleClose} /> : null}
          {activePanel === '03' ? <KeyValueList rows={PERF_ROWS} /> : null}
          {activePanel === '04' ? <KeyValueList rows={COMMERCE_ROWS} /> : null}
          {activePanel === '05' ? <SourcePanel /> : null}
        </div>

        <footer className="border-t border-[var(--color-rule)] px-8 py-4 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-lichen)]">
          Press <kbd className="rounded border border-[var(--color-rule)] px-1 text-[9px]">D</kbd>{' '}
          anywhere · ESC to close
        </footer>
      </aside>
    </>
  );
}

function KeyValueList({
  rows,
}: {
  readonly rows: readonly { readonly label: string; readonly value: string }[];
}): ReactElement {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 font-mono text-[12px] leading-relaxed">
      {rows.map((row) => (
        <div key={row.label} className="contents">
          <dt className="text-[10px] uppercase tracking-[0.08em] text-[var(--color-lichen)]">
            {row.label}
          </dt>
          <dd className="text-[var(--color-ink)]">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function FeatureList({
  items,
  onSelect,
}: {
  readonly items: readonly FeatureLink[];
  readonly onSelect: () => void;
}): ReactElement {
  return (
    <ul className="flex flex-col gap-4">
      {items.map((item) => (
        <li key={item.label}>
          <Link
            href={item.href}
            onClick={onSelect}
            className="group/feature flex flex-col gap-1 border-b border-[var(--color-rule)] pb-3 last:border-b-0"
          >
            <span className="font-display text-[15px] font-medium leading-tight text-[var(--color-ink)] transition-colors group-hover/feature:text-[var(--color-signal)]">
              {item.label}{' '}
              <span className="font-mono text-[var(--color-signal)] transition-transform group-hover/feature:translate-x-1">
                →
              </span>
            </span>
            <span className="font-mono text-[11px] leading-relaxed text-[var(--color-lichen)]">
              {item.description}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function SourcePanel(): ReactElement {
  return (
    <div className="flex flex-col gap-5">
      <a
        href="https://github.com/jose-galiano/manifest-office"
        target="_blank"
        rel="noopener noreferrer"
        className="group/src flex flex-col gap-1 border-b border-[var(--color-rule)] pb-3"
      >
        <span className="font-display text-[15px] font-medium leading-tight text-[var(--color-ink)] transition-colors group-hover/src:text-[var(--color-signal)]">
          github.com/jose-galiano/manifest-office{' '}
          <span className="font-mono text-[var(--color-signal)]">↗</span>
        </span>
        <span className="font-mono text-[11px] leading-relaxed text-[var(--color-lichen)]">
          MIT · public · CI on every push (typecheck · lint · format · build)
        </span>
      </a>
      <a
        href="https://maelify.com"
        target="_blank"
        rel="noopener noreferrer"
        className="group/src flex flex-col gap-1 border-b border-[var(--color-rule)] pb-3"
      >
        <span className="font-display text-[15px] font-medium leading-tight text-[var(--color-ink)] transition-colors group-hover/src:text-[var(--color-signal)]">
          maelify.com <span className="font-mono text-[var(--color-signal)]">↗</span>
        </span>
        <span className="font-mono text-[11px] leading-relaxed text-[var(--color-lichen)]">
          Jose Galiano — Shopify Plus architect · headless commerce · AI-native UX
        </span>
      </a>
      <a
        href="mailto:hello@maelify.com"
        className="group/src flex flex-col gap-1 border-b border-[var(--color-rule)] pb-3"
      >
        <span className="font-display text-[15px] font-medium leading-tight text-[var(--color-ink)] transition-colors group-hover/src:text-[var(--color-signal)]">
          hello@maelify.com <span className="font-mono text-[var(--color-signal)]">→</span>
        </span>
        <span className="font-mono text-[11px] leading-relaxed text-[var(--color-lichen)]">
          Open to long-term engagements · €15-20k/mo · EU-based
        </span>
      </a>
      <p className="font-mono text-[11px] leading-relaxed text-[var(--color-lichen)]">
        This site is a portfolio piece. The brand &ldquo;Manifest Office&rdquo; is fictional. The
        commerce wiring, the imagery, the analytics fanout, the WebGL, the AI endpoints and the
        build infrastructure are real and shipping.
      </p>
    </div>
  );
}
