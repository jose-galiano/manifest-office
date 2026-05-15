// `/llms-full.txt` — the extended variant. Carries full product descriptions,
// collection contents, and policy detail in a single text file so agents can
// answer "what does Manifest Office sell, in detail" with one GET.

import { NextResponse } from 'next/server';

import { buildLlmsFullTxt } from '@/lib/seo/llms';

export const dynamic = 'force-static';
export const revalidate = 3600;

export function GET(): NextResponse {
  return new NextResponse(buildLlmsFullTxt(), {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
