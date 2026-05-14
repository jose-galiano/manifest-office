// POST /api/desk — Gemini-backed trip-brief → kit-manifest endpoint.
//
// Seven security layers (preserve order):
//   1. Origin allowlist (Layer C).
//   2. Honeypot (Layer E) — silently 200 if the hidden field is populated.
//   3. Input validation (Layer D) — length / words / injection patterns.
//   4. Turnstile (Layer F).
//   5. Rate limit (Layer B) — 5/hour, 20/day per IP.
//   6. Cache (Layer G) — handled inside the service.
//   7. Gemini call.

import { NextResponse } from 'next/server';

import { clientIp } from '@/lib/security/client-ip';
import { deriveOrigin, isAllowedOrigin } from '@/lib/security/origin';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { verifyTurnstile } from '@/lib/security/turnstile';
import { validateBrief } from '@/lib/security/validate-brief';
import { briefDesk } from '@/lib/services/brief-desk';
import { MissingEnvError } from '@/lib/utils/env';

import type { DeskHoneypotResponse } from '@/lib/types/desk';

type RawDeskBody = {
  brief?: unknown;
  honey?: unknown;
  turnstile?: unknown;
};

function corsHeaders(allowedOrigin: string | null): HeadersInit {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Turnstile-Token',
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

export async function POST(request: Request): Promise<Response> {
  // ===== Layer C · Origin allowlist =====
  const origin = deriveOrigin(request);
  const originAllowed = isAllowedOrigin(origin);
  const headers = corsHeaders(originAllowed ? origin : null);
  if (!originAllowed) {
    return NextResponse.json({ error: 'origin_not_allowed' }, { status: 403, headers });
  }

  let body: RawDeskBody;
  try {
    body = (await request.json()) as RawDeskBody;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400, headers });
  }

  // ===== Layer E · Honeypot =====
  if (typeof body.honey === 'string' && body.honey.length > 0) {
    const decoy: DeskHoneypotResponse = {
      re: 'received',
      allocation: '',
      forecast: '',
      note: '',
      total: '',
      items: [],
    };
    return NextResponse.json(decoy, { status: 200, headers });
  }

  // ===== Layer D · Input validation =====
  const validation = validateBrief(body.brief);
  if (!validation.ok) {
    return NextResponse.json(
      { error: 'invalid_brief', reason: validation.reason },
      { status: 400, headers },
    );
  }

  const ipAddress = clientIp(request);

  // ===== Layer F · Turnstile =====
  const turnstileToken = typeof body.turnstile === 'string' ? body.turnstile : '';
  const turnstileResult = await verifyTurnstile(turnstileToken, ipAddress);
  if (!turnstileResult.ok) {
    return NextResponse.json(
      { error: 'turnstile_required', reason: turnstileResult.reason },
      { status: 403, headers },
    );
  }

  // ===== Layer B · Rate limit =====
  const rateLimit = await checkRateLimit(ipAddress);
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

  // ===== Layer G + 7 · Cache + Gemini call =====
  try {
    const deskResult = await briefDesk({ brief: validation.trimmed, ipAddress });
    if (!deskResult.ok) {
      return NextResponse.json(
        { error: deskResult.error, detail: deskResult.detail ?? null },
        { status: deskResult.status, headers },
      );
    }
    return NextResponse.json(deskResult.data, { status: 200, headers });
  } catch (caught) {
    if (caught instanceof MissingEnvError) {
      return NextResponse.json(
        { error: 'missing_gemini_key', variable: caught.variable },
        { status: 500, headers },
      );
    }
    return NextResponse.json(
      { error: 'desk_failed', message: caught instanceof Error ? caught.message : 'unknown_error' },
      { status: 500, headers },
    );
  }
}
