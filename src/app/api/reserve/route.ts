// POST /api/reserve — issues one allocation from Edition 01: bumps the
// `manifest.allocation_issued` metafield and decrements inventory at the
// primary location. Engraving payload is sanitised server-side and the
// engraving fee is re-derived from `lib/constants/commerce` (anti-tamper).
//
// Hardened: origin allowlist + per-IP rate-limit. Cross-site abuse can no
// longer inflate the allocation counter from arbitrary origins.

import { NextResponse } from 'next/server';

import { clientIp } from '@/lib/security/client-ip';
import { deriveOrigin, isAllowedOrigin } from '@/lib/security/origin';
import { checkReserveRateLimit } from '@/lib/security/rate-limit';
import { reserveProduct } from '@/lib/services/reserve-product';
import { MissingEnvError } from '@/lib/utils/env';

function corsHeaders(allowedOrigin: string | null): HeadersInit {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
  if (allowedOrigin) {
    headers['Access-Control-Allow-Origin'] = allowedOrigin;
  }
  return headers;
}

export function OPTIONS(request: Request): Response {
  const origin = deriveOrigin(request);
  const allowedOrigin = isAllowedOrigin(origin) ? origin : null;
  return new Response(null, { status: 200, headers: corsHeaders(allowedOrigin) });
}

type RawReserveBody = {
  handle?: unknown;
  engraving?: unknown;
};

export async function POST(request: Request): Promise<Response> {
  const origin = deriveOrigin(request);
  const originAllowed = isAllowedOrigin(origin);
  const headers = corsHeaders(originAllowed ? origin : null);
  if (!originAllowed) {
    return NextResponse.json({ error: 'origin_not_allowed' }, { status: 403, headers });
  }

  const ipAddress = clientIp(request);
  const rateLimit = await checkReserveRateLimit(ipAddress);
  if (!rateLimit.ok) {
    const rateLimitHeaders: HeadersInit = {
      ...headers,
      'Retry-After': String(rateLimit.retryAfter),
    };
    return NextResponse.json(
      { error: 'rate_limited', reason: rateLimit.reason, retry_after_sec: rateLimit.retryAfter },
      { status: 429, headers: rateLimitHeaders },
    );
  }

  let body: RawReserveBody;
  try {
    body = (await request.json()) as RawReserveBody;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400, headers });
  }

  if (typeof body.handle !== 'string' || body.handle.length === 0) {
    return NextResponse.json({ error: 'missing_handle' }, { status: 400, headers });
  }

  const engraving =
    typeof body.engraving === 'string' && body.engraving.length > 0 ? body.engraving : null;

  try {
    const result = await reserveProduct({ handle: body.handle, engraving });
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, detail: result.detail ?? null },
        { status: result.status, headers },
      );
    }
    return NextResponse.json(result.data, { status: 200, headers });
  } catch (caught) {
    if (caught instanceof MissingEnvError) {
      return NextResponse.json(
        { error: 'missing_credentials', variable: caught.variable },
        { status: 500, headers },
      );
    }
    return NextResponse.json(
      {
        error: 'reserve_failed',
        message: caught instanceof Error ? caught.message : 'unknown_error',
      },
      { status: 500, headers },
    );
  }
}
