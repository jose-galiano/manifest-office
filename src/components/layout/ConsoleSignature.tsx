/**
 * `<ConsoleSignature />` — devtools easter-egg for the technically curious.
 *
 * When a visitor opens the browser console, a styled message identifies the
 * engineer behind the build, the stack, the surfaces worth poking at, and a
 * direct line for hiring conversations. Fires exactly once per page load
 * (guarded on `window`) so SPA-style navigations don't spam the console.
 *
 * Why this exists: a non-trivial fraction of recruiters and CTOs evaluating
 * commerce work in 2026 open devtools as a quality signal. Stripe, Vercel,
 * Linear, and most senior DTC brands ship a console-signature pattern; the
 * cost is < 1 KB and the conversion-into-conversation rate is real.
 *
 * Implementation:
 *  - Pure side-effect in a `useEffect`. No DOM output.
 *  - `console.info` rather than `log` so it filters cleanly in the Info tab.
 *  - Styled segments via `%c` directives — paper-on-ink card aesthetic.
 *  - Window-scoped flag prevents duplicates on re-render or strict-mode
 *    double-mount.
 */

'use client';

import { useEffect } from 'react';

import type { ReactElement } from 'react';

interface WithSignatureFlag extends Window {
  __moConsoleSignatureSeen?: boolean;
}

// CSS for the `%c` directives. Each `console.info(text, css1, css2, …)`
// call applies the next `%c`-prefixed substring to the next CSS string in
// the args. Keep these short so the output is readable on first paint.
const STYLE_WORDMARK = [
  'display: inline-block',
  'padding: 18px 22px',
  'background: #D24A1F',
  'color: #F2EFE8',
  'font: 700 22px/1 "Space Grotesk", system-ui, sans-serif',
  'letter-spacing: 0.06em',
  'border-radius: 2px',
].join(';');

const STYLE_BLOCK_LABEL = [
  'color: #D24A1F',
  'font: 600 11px/1.6 "JetBrains Mono", ui-monospace, monospace',
  'letter-spacing: 0.14em',
  'text-transform: uppercase',
].join(';');

const STYLE_BODY = ['color: #0B0F0E', 'font: 400 13px/1.6 "Inter", system-ui, sans-serif'].join(
  ';',
);

const STYLE_MONO = [
  'color: #5C6B5A',
  'font: 400 12px/1.7 "JetBrains Mono", ui-monospace, monospace',
  'letter-spacing: 0.02em',
].join(';');

const STYLE_LINK = [
  'color: #D24A1F',
  'font: 600 13px/1.6 "JetBrains Mono", ui-monospace, monospace',
  'text-decoration: underline',
  'text-underline-offset: 3px',
].join(';');

const STYLE_FOOTER = [
  'color: #5C6B5A',
  'font: 400 10px/1.6 "JetBrains Mono", ui-monospace, monospace',
  'letter-spacing: 0.08em',
  'text-transform: uppercase',
].join(';');

function emitSignature(): void {
  // ── Wordmark ──
  console.info('%c MANIFEST OFFICE · EDITION 01 ', STYLE_WORDMARK);

  // ── Pitch ──
  console.info(
    '\n%c↳ Looking under the hood. Good.\n\n' +
      '%cThis storefront is a public portfolio piece by Jose Galiano —\n' +
      'a Shopify Plus / headless-commerce architect based in Valencia.\n',
    STYLE_BLOCK_LABEL,
    STYLE_BODY,
  );

  // ── Stack ──
  console.info(
    '%cSTACK\n' +
      '%c· Next.js 15 (App Router · RSC · streaming)\n' +
      '· TypeScript strict · Tailwind 4 · Zustand\n' +
      '· Three.js — WebGL hero + 3D exploded latch viewer\n' +
      '· Shopify Admin GraphQL · Klaviyo Events · Google Gemini 2.5\n' +
      '· Vercel · edge functions · Cloudflare Turnstile · Upstash Redis\n',
    STYLE_BLOCK_LABEL,
    STYLE_MONO,
  );

  // ── Surfaces worth poking ──
  console.info(
    '%cTRY ALSO\n' +
      '%c/api/products  — typed JSON feed of the live Shopify catalog\n' +
      '/llms.txt       — agentic-commerce ingest (llmstxt.org)\n' +
      '/sitemap.xml    — full canonical route map\n' +
      '/robots.txt     — explicit AI-crawler allowlist\n',
    STYLE_BLOCK_LABEL,
    STYLE_MONO,
  );

  // ── Hire / connect ──
  console.info(
    '%cHIRING? BUILDING SOMETHING HARD?\n\n' +
      '%chello@maelify.com\n' +
      '%clinkedin.com/in/jose-galiano\n' +
      'github.com/jose-galiano/manifest-office\n',
    STYLE_BLOCK_LABEL,
    STYLE_LINK,
    STYLE_MONO,
  );

  // ── Signoff ──
  console.info('%cPowered by Maelify.com', STYLE_FOOTER);
}

export function ConsoleSignature(): ReactElement | null {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const win = window as WithSignatureFlag;
    if (win.__moConsoleSignatureSeen) return;
    win.__moConsoleSignatureSeen = true;
    emitSignature();
  }, []);
  return null;
}
