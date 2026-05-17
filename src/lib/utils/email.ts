export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,24}$/;

// Common keyboard slips for .com/.net/.org. Domains ending in one of these
// are treated as a typo rather than a valid TLD.
export const TYPO_TLDS: ReadonlySet<string> = new Set([
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
  'ner',
  'ent',
  'nte',
  'ort',
  'rg',
  'orgg',
  'ogr',
]);

export type EmailValidation =
  | { readonly ok: true; readonly email: string }
  | { readonly ok: false; readonly reason: 'format' | 'typo' };

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
