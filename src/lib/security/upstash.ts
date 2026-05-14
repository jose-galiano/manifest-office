// Upstash Redis REST helper. Returns `null` when credentials are missing OR
// when any network/decoding error occurs — every consumer is required to
// fail-open in that case so local dev works without Upstash provisioning.

import { getEnvOptional } from '@/lib/utils/env';

type UpstashEnvelope = { result: unknown };

export async function redisCommand(command: readonly string[]): Promise<unknown> {
  const url = getEnvOptional('UPSTASH_REDIS_REST_URL');
  const token = getEnvOptional('UPSTASH_REDIS_REST_TOKEN');
  if (!url || !token) {
    return null;
  }
  try {
    const path = command.map(encodeURIComponent).join('/');
    const response = await fetch(`${url}/${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      return null;
    }
    const envelope = (await response.json()) as UpstashEnvelope;
    return envelope.result;
  } catch {
    return null;
  }
}

export function hasUpstashCreds(): boolean {
  return Boolean(
    getEnvOptional('UPSTASH_REDIS_REST_URL') && getEnvOptional('UPSTASH_REDIS_REST_TOKEN'),
  );
}
