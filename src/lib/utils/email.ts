/**
 * Shared email validation. Two layers:
 *  1. Format regex — catches anything that isn't shaped like an email.
 *  2. Typo-TLD guard — rejects domains ending in common .com/.net/.org
 *     keyboard slips (`.xom`, `.con`, `.ner`, etc.). A real production stack
 *     would call out to a verification service; for this demo a small
 *     allowlist trades zero perfectionism for catching the obvious cases.
 *
 * Used by both client code (cart drawer + homepage capture form) and the
 * `/api/track` route so the server can refuse to create Klaviyo profiles for
 * obviously-bad submissions.
 */

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,24}$/;

/**
 * Common keyboard-adjacent typos of `.com`, `.net`, `.org`. Lowercase, no
 * leading dot. If a submitted email's TLD lands in this set, treat it as a
 * typo rather than a valid address.
 */
export const TYPO_TLDS: ReadonlySet<string> = new Set([
  // .com slips
  'con',
  'cm',
  'cmo',
  'ckm',
  'ocm',
  'comm',
  'xom',
  'vom',
  'fom',
  'dom',
  'cim',
  'cum',
  'cpm',
  // .net slips
  'ner',
  'ent',
  'nte',
  // .org slips
  'ort',
  'rg',
  'orgg',
  'ogr',
]);

export type EmailValidation =
  | { readonly ok: true; readonly email: string }
  | { readonly ok: false; readonly reason: 'format' | 'typo' };

/** Returns the lowercase TLD (e.g. "xom" from "foo@bar.xom") or null. */
function extractTld(email: string): string | null {
  const at = email.lastIndexOf('@');
  if (at < 0) return null;
  const domain = email.slice(at + 1).toLowerCase();
  const dot = domain.lastIndexOf('.');
  if (dot < 0) return null;
  const tld = domain.slice(dot + 1);
  return tld.length > 0 ? tld : null;
}

export function validateEmail(input: string): EmailValidation {
  const trimmed = input.trim();
  if (!EMAIL_PATTERN.test(trimmed)) return { ok: false, reason: 'format' };
  const tld = extractTld(trimmed);
  if (tld !== null && TYPO_TLDS.has(tld)) return { ok: false, reason: 'typo' };
  return { ok: true, email: trimmed };
}
