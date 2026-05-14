// Per-IP rate limit for `/api/desk`. Two windows: hourly and daily. Both are
// fail-open when Redis is unavailable — the desk must keep working in local
// dev without Upstash credentials.

import {
  RATE_LIMIT_DAY_SECONDS,
  RATE_LIMIT_HOUR_SECONDS,
  RATE_LIMIT_PER_DAY,
  RATE_LIMIT_PER_HOUR,
} from '@/lib/constants/security';
import { hasUpstashCreds, redisCommand } from '@/lib/security/upstash';

export type RateLimitOk = { ok: true; hourCount: number | null; dayCount: number | null };
export type RateLimitDenied = {
  ok: false;
  reason: 'too_many_per_hour' | 'too_many_per_day';
  retryAfter: number;
};
export type RateLimitResult = RateLimitOk | RateLimitDenied;

export async function checkRateLimit(ipAddress: string): Promise<RateLimitResult> {
  if (!hasUpstashCreds()) {
    return { ok: true, hourCount: null, dayCount: null };
  }

  const hourKey = `desk:rl:h:${ipAddress}`;
  const dayKey = `desk:rl:d:${ipAddress}`;

  const hourCount = await incrementWithExpiry(hourKey, RATE_LIMIT_HOUR_SECONDS);
  const dayCount = await incrementWithExpiry(dayKey, RATE_LIMIT_DAY_SECONDS);

  if (typeof hourCount === 'number' && hourCount > RATE_LIMIT_PER_HOUR) {
    return { ok: false, reason: 'too_many_per_hour', retryAfter: RATE_LIMIT_HOUR_SECONDS };
  }
  if (typeof dayCount === 'number' && dayCount > RATE_LIMIT_PER_DAY) {
    return { ok: false, reason: 'too_many_per_day', retryAfter: RATE_LIMIT_DAY_SECONDS };
  }
  return { ok: true, hourCount, dayCount };
}

async function incrementWithExpiry(key: string, ttlSeconds: number): Promise<number | null> {
  const count = await redisCommand(['INCR', key]);
  if (typeof count !== 'number') {
    return null;
  }
  if (count === 1) {
    await redisCommand(['EXPIRE', key, String(ttlSeconds)]);
  }
  return count;
}
