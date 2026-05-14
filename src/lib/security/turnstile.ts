// Cloudflare Turnstile token verification. Fail-open when no secret is set
// (local dev). Fail-closed only when a secret IS set but the token is
// missing or invalid.

import { getEnvOptional } from '@/lib/utils/env';

export type TurnstileOk = { ok: true };
export type TurnstileDenied = {
  ok: false;
  reason: 'missing_turnstile_token' | 'turnstile_failed' | 'turnstile_network_error';
  codes?: unknown;
};
export type TurnstileResult = TurnstileOk | TurnstileDenied;

type TurnstileApiResponse = {
  success?: boolean;
  'error-codes'?: unknown;
};

export async function verifyTurnstile(
  token: string | undefined | null,
  ipAddress: string,
): Promise<TurnstileResult> {
  const secret = getEnvOptional('TURNSTILE_SECRET_KEY');
  if (!secret) {
    return { ok: true };
  }
  if (!token) {
    return { ok: false, reason: 'missing_turnstile_token' };
  }
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret,
        response: token,
        remoteip: ipAddress,
      }).toString(),
    });
    const data = (await response.json()) as TurnstileApiResponse;
    if (!data.success) {
      return { ok: false, reason: 'turnstile_failed', codes: data['error-codes'] };
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: 'turnstile_network_error' };
  }
}
