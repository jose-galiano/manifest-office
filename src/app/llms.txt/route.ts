// `/llms.txt` — the llmstxt.org root contract. Served as `text/plain` so
// agentic crawlers don't need HTML parsing. Cache aggressively; the content
// changes only when the catalogue changes.

import { NextResponse } from 'next/server';

import { buildLlmsTxt } from '@/lib/seo/llms';

export const dynamic = 'force-static';
export const revalidate = 3600;

export function GET(): NextResponse {
  return new NextResponse(buildLlmsTxt(), {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
