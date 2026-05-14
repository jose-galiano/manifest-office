// Per-IP + per-brief response cache for the desk. Same operator asking the
// same thing within an hour gets the same answer back, free.

import { DESK_CACHE_TTL_SECONDS } from '@/lib/constants/security';
import { shortSha } from '@/lib/security/sha';
import { hasUpstashCreds, redisCommand } from '@/lib/security/upstash';

function cacheKey(brief: string, ipAddress: string): string {
  return `desk:cache:${shortSha(`${ipAddress}|${brief.toLowerCase().trim()}`)}`;
}

export async function cacheGet<T>(brief: string, ipAddress: string): Promise<T | null> {
  if (!hasUpstashCreds()) {
    return null;
  }
  const raw = await redisCommand(['GET', cacheKey(brief, ipAddress)]);
  if (typeof raw !== 'string') {
    return null;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function cacheSet<T>(
  brief: string,
  ipAddress: string,
  value: T,
  ttlSeconds: number = DESK_CACHE_TTL_SECONDS,
): Promise<void> {
  if (!hasUpstashCreds()) {
    return;
  }
  await redisCommand([
    'SET',
    cacheKey(brief, ipAddress),
    JSON.stringify(value),
    'EX',
    String(ttlSeconds),
  ]);
}
