// POST /api/reserve — issues one allocation from Edition 01: bumps the
// `manifest.allocation_issued` metafield and decrements inventory at the
// primary location. The engraving payload is sanitised server-side and the
// engraving fee is re-derived from `lib/constants/commerce` (anti-tamper).

import { NextResponse } from 'next/server';

import { reserveProduct } from '@/lib/services/reserve-product';
import { MissingEnvError } from '@/lib/utils/env';

const CORS_HEADERS: HeadersInit = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export function OPTIONS(): Response {
  return new Response(null, { status: 200, headers: CORS_HEADERS });
}

type RawReserveBody = {
  handle?: unknown;
  engraving?: unknown;
};

export async function POST(request: Request): Promise<Response> {
  let body: RawReserveBody;
  try {
    body = (await request.json()) as RawReserveBody;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400, headers: CORS_HEADERS });
  }

  if (typeof body.handle !== 'string' || body.handle.length === 0) {
    return NextResponse.json({ error: 'missing_handle' }, { status: 400, headers: CORS_HEADERS });
  }

  const engraving =
    typeof body.engraving === 'string' && body.engraving.length > 0 ? body.engraving : null;

  try {
    const result = await reserveProduct({ handle: body.handle, engraving });
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, detail: result.detail ?? null },
        { status: result.status, headers: CORS_HEADERS },
      );
    }
    return NextResponse.json(result.data, { status: 200, headers: CORS_HEADERS });
  } catch (caught) {
    if (caught instanceof MissingEnvError) {
      return NextResponse.json(
        { error: 'missing_credentials', variable: caught.variable },
        { status: 500, headers: CORS_HEADERS },
      );
    }
    return NextResponse.json(
      {
        error: 'reserve_failed',
        message: caught instanceof Error ? caught.message : 'unknown_error',
      },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}
