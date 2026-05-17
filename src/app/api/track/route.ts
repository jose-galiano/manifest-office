// Klaviyo Client API event ingest. Requests without a verified email are
// accepted with `{ skipped: "no_email" }` so anonymous behavioural events
// don't create Klaviyo profiles.

import { NextResponse } from 'next/server';

import { trackEvent } from '@/lib/services/track-event';
import { validateEmail } from '@/lib/utils/email';
import { MissingEnvError } from '@/lib/utils/env';

import type { KlaviyoEventProperties } from '@/lib/types/klaviyo';

const CORS_HEADERS: HeadersInit = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export function OPTIONS(): Response {
  return new Response(null, { status: 200, headers: CORS_HEADERS });
}

type RawTrackBody = {
  event?: unknown;
  email?: unknown;
  anonymousId?: unknown;
  properties?: unknown;
};

type ParsedTrackBody = {
  event: string;
  email?: string;
  anonymousId?: string;
  properties?: KlaviyoEventProperties;
};

type SkipReason = 'no_email' | 'invalid_email';

type ParseResult =
  | { ok: true; data: ParsedTrackBody }
  | { ok: false; status: number; error: string }
  | { ok: false; status: 200; skip: SkipReason };

async function parseTrackBody(request: Request): Promise<ParseResult> {
  let raw: RawTrackBody;
  try {
    raw = (await request.json()) as RawTrackBody;
  } catch {
    return { ok: false, status: 400, error: 'invalid_json' };
  }
  if (typeof raw.event !== 'string' || raw.event.length === 0) {
    return { ok: false, status: 400, error: 'missing_event' };
  }
  const rawEmail = typeof raw.email === 'string' ? raw.email.trim() : '';
  if (rawEmail.length === 0) {
    return { ok: false, status: 200, skip: 'no_email' };
  }
  const validation = validateEmail(rawEmail);
  if (!validation.ok) {
    return { ok: false, status: 200, skip: 'invalid_email' };
  }
  const anonymousId =
    typeof raw.anonymousId === 'string' && raw.anonymousId.length > 0 ? raw.anonymousId : undefined;
  const properties =
    raw.properties !== null && typeof raw.properties === 'object'
      ? (raw.properties as KlaviyoEventProperties)
      : undefined;
  return {
    ok: true,
    data: { event: raw.event, email: validation.email, anonymousId, properties },
  };
}

export async function POST(request: Request): Promise<Response> {
  const parsed = await parseTrackBody(request);
  if (!parsed.ok) {
    if ('skip' in parsed) {
      return NextResponse.json(
        { ok: false, skipped: parsed.skip },
        { status: 200, headers: CORS_HEADERS },
      );
    }
    return NextResponse.json(
      { error: parsed.error },
      { status: parsed.status, headers: CORS_HEADERS },
    );
  }

  try {
    const result = await trackEvent(parsed.data);
    if (!result.ok) {
      return NextResponse.json(
        { error: 'track_failed', message: result.error },
        { status: result.status, headers: CORS_HEADERS },
      );
    }
    return NextResponse.json(result.data, { status: 200, headers: CORS_HEADERS });
  } catch (caught) {
    if (caught instanceof MissingEnvError) {
      return NextResponse.json(
        { error: 'missing_klaviyo_public', variable: caught.variable },
        { status: 500, headers: CORS_HEADERS },
      );
    }
    return NextResponse.json(
      {
        error: 'track_failed',
        message: caught instanceof Error ? caught.message : 'unknown_error',
      },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}
