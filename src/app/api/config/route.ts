// GET /api/config — public client config. Site keys only, never secrets.

import { NextResponse } from 'next/server';

import { getEnvOptional } from '@/lib/utils/env';

import type { ClientConfig } from '@/lib/types/config';

export async function GET(): Promise<NextResponse<ClientConfig>> {
  const config: ClientConfig = {
    turnstile_site_key: getEnvOptional('TURNSTILE_SITE_KEY'),
  };

  return NextResponse.json(config, {
    headers: {
      'Cache-Control': 'public, max-age=300',
    },
  });
}
