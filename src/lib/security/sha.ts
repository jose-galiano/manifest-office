// 16-char SHA-256 helper for cache keys. Matches the legacy
// `deploy/api/_lib/security.js:sha` behaviour byte-for-byte.

import crypto from 'node:crypto';

export function shortSha(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex').slice(0, 16);
}
