// i18n middleware. Detects locale from cookie, then Accept-Language, then
// falls back to the configured default. Persists the explicit choice via
// the `NEXT_LOCALE` cookie so a later visit respects the visitor's last
// override over their browser settings.

import createMiddleware from 'next-intl/middleware';

import { routing } from '@/i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Skip the things that must not be rewritten through the locale segment:
  //   /api/*           – API routes are locale-agnostic
  //   /_next/*         – Next.js internals
  //   /images/*        – static assets in /public
  //   /scroll-video/*  – the 193-frame AVIF sequence
  //   /mood-board/*    – editorial imagery
  //   /sitemap.xml, /robots.txt, /llms.txt, /llms-full.txt,
  //   /opengraph-image, /icon, /apple-icon, /favicon.ico
  // The pattern below matches everything EXCEPT those (negative lookahead).
  matcher: ['/((?!api|_next|images|scroll-video|mood-board|.*\\..*).*)'],
};
