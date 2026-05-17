/**
 * Root analytics orchestrator.
 *
 * Mounted once from `app/layout.tsx`. Responsible for:
 *   1. Setting Consent Mode v2 defaults BEFORE any tag loads (inline head
 *      script, `beforeInteractive` strategy).
 *   2. Loading the GTM container (single tag manager for everything else).
 *   3. Loading Microsoft Clarity for session replay + heatmaps.
 *   4. Mounting the SPA `page_view`, scroll-depth, auto-click, and rage-
 *      click watchers as client-only sub-components.
 *   5. Rendering the consent banner.
 *
 * Reads three env vars (all `NEXT_PUBLIC_*` so they're inlined at build):
 *   - NEXT_PUBLIC_GTM_ID    e.g. GTM-5HMML5DX (required for any tracking)
 *   - NEXT_PUBLIC_CLARITY_ID  e.g. abcd1234   (optional, no Clarity if blank)
 *
 * SSR-safe: every browser-only effect lives inside the sub-components.
 */

import { Suspense } from 'react';

import { AutoClickTracker } from './AutoClickTracker';
import { ConsentBanner } from './ConsentBanner';
import { PageViewTracker } from './PageViewTracker';
import { RageClickDetector } from './RageClickDetector';
import { ScrollDepthTracker } from './ScrollDepthTracker';

import type { ReactElement } from 'react';

// `.trim()` is defensive: dashboard / CLI env entry sometimes carries a
// trailing newline (e.g. `echo "X" | vercel env add`) which silently
// breaks the inline GTM bootstrap (string literal across a newline →
// SyntaxError, no gtm.js src tag injected).
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID?.trim();
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID?.trim();

// GTM + Clarity bootstrap, deferred until `requestIdleCallback` (or a 2s
// setTimeout fallback). Loading them eagerly pushed ~280 KB of mostly-unused
// JS onto the main thread before FCP, hurting LCP and Speed Index. Page-view
// + dataLayer events queued during the wait are flushed when GTM lands.
const DEFER_HARNESS_OPEN = `
(function(boot){
  if (typeof window === 'undefined') return;
  var run = function(){ try { boot(); } catch (_) {} };
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(run, { timeout: 4000 });
  } else {
    window.setTimeout(run, 1200);
  }
})(function(){`;
const DEFER_HARNESS_CLOSE = `});`;

function gtmScript(id: string): string {
  return `${DEFER_HARNESS_OPEN}
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${id}');
${DEFER_HARNESS_CLOSE}`;
}

function clarityScript(id: string): string {
  return `${DEFER_HARNESS_OPEN}
(function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "${id}");
${DEFER_HARNESS_CLOSE}`;
}

export function Analytics(): ReactElement | null {
  if (!GTM_ID) {
    // Without a container ID there's nothing to load. Tracker components are
    // still safe (they no-op into dataLayer) but skipping them avoids the
    // event listener overhead in environments where it'd never be observed.
    return null;
  }

  return (
    <>
      {/*
        NOTE: the Consent Mode v2 default is set by a raw <script> tag in
        `app/layout.tsx`'s <head>, BEFORE this component renders. That
        ordering guarantees `gtag('consent', 'default', ...)` runs before
        GTM is fetched. Don't try to push the consent default from here
        with `next/script beforeInteractive` — App Router forbids it
        outside `pages/_document.js`.
      */}
      {/* Raw <script> tags rather than next/script. With Next 15.5.18 the
          `afterInteractive` Script + `dangerouslySetInnerHTML` combo throws
          a SyntaxError during hydration in production builds (the Script
          component clones the node and one path mangles the inline body),
          which prevents GTM from injecting the gtm.js src tag at all. A
          plain inline <script> just runs as the body parser reaches it. */}
      <script id="gtm-base" dangerouslySetInnerHTML={{ __html: gtmScript(GTM_ID) }} />
      {CLARITY_ID ? (
        <script id="clarity" dangerouslySetInnerHTML={{ __html: clarityScript(CLARITY_ID) }} />
      ) : null}

      {/*
        Sub-trackers run as their own client components so the orchestrator
        stays a server component (no `'use client'`) and gets statically
        analysed by Next's bundler. `useSearchParams` requires Suspense.
      */}
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
      <ScrollDepthTracker />
      <AutoClickTracker />
      <RageClickDetector />
      <ConsentBanner />
    </>
  );
}

export function AnalyticsNoScript(): ReactElement | null {
  if (!GTM_ID) return null;
  return (
    <noscript>
      <iframe
        title="gtm-noscript"
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
      />
    </noscript>
  );
}
