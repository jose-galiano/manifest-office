// Klaviyo Client API wrapper. Uses the public company id passed as a query
// parameter — no Authorization header — designed for browser / serverless
// event ingest. This is deliberate: we use the Client API so the demo can
// fire events without the `events:write` scope the private API key lacks.

import { KLAVIYO_CLIENT_BASE, KLAVIYO_REVISION } from '@/lib/constants/klaviyo';
import { getEnv } from '@/lib/utils/env';

export type KlaviyoCallResult = {
  ok: boolean;
  status: number;
  detail?: string;
};

async function klaviyoFetch(
  path: 'events' | 'profiles',
  payload: unknown,
): Promise<KlaviyoCallResult> {
  const companyId = getEnv('KLAVIYO_PUBLIC_KEY');
  const response = await fetch(
    `${KLAVIYO_CLIENT_BASE}/${path}/?company_id=${encodeURIComponent(companyId)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        revision: KLAVIYO_REVISION,
      },
      body: JSON.stringify(payload),
    },
  );

  if (response.ok) {
    return { ok: true, status: response.status };
  }
  return {
    ok: false,
    status: response.status,
    detail: await readErrorBody(response),
  };
}

async function readErrorBody(response: Response): Promise<string | undefined> {
  try {
    return await response.text();
  } catch {
    return undefined;
  }
}

export const klaviyoClient = {
  postEvent: (payload: unknown): Promise<KlaviyoCallResult> => klaviyoFetch('events', payload),
  postProfile: (payload: unknown): Promise<KlaviyoCallResult> => klaviyoFetch('profiles', payload),
};
