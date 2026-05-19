/**
 * `<LocaleSwitcher />` — header control that swaps the active locale.
 *
 * Reads the current locale from `useLocale()`, the current pathname from
 * `usePathname()`, and rewrites only the leading segment on click. The
 * NEXT_LOCALE cookie that the middleware reads on subsequent visits is
 * also updated so a return visit doesn't get bounced back to the browser
 * default. Compact in the header, expanded list inside the mobile menu.
 */

'use client';

import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useTransition } from 'react';

import { LOCALE_FULL_NAMES, LOCALE_LABELS, routing, type Locale } from '@/i18n/routing';

import type { MouseEvent, ReactElement } from 'react';

type LocaleSwitcherProps = {
  /** Layout — `inline` for the desktop header, `stack` for the mobile menu. */
  readonly variant?: 'inline' | 'stack';
  readonly onSelect?: () => void;
};

const LOCALE_COOKIE_MAX_AGE = 31536000;

function withLocale(pathname: string, locale: Locale): string {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return `/${locale}`;
  segments[0] = locale;
  return `/${segments.join('/')}`;
}

export function LocaleSwitcher({
  variant = 'inline',
  onSelect,
}: LocaleSwitcherProps): ReactElement {
  const active = useLocale() as Locale;
  const pathname = usePathname() || '/';
  const router = useRouter();
  const [, startTransition] = useTransition();

  function switchTo(event: MouseEvent<HTMLButtonElement>, next: Locale): void {
    event.preventDefault();
    if (next === active) return;
    if (typeof document !== 'undefined') {
      document.cookie = `NEXT_LOCALE=${next};path=/;max-age=${LOCALE_COOKIE_MAX_AGE};samesite=lax`;
    }
    const target = withLocale(pathname, next);
    startTransition(() => {
      router.replace(target);
      onSelect?.();
    });
  }

  if (variant === 'stack') {
    return (
      <div className="flex flex-col gap-3" aria-label="Choose language">
        {routing.locales.map((locale) => {
          const isActive = locale === active;
          return (
            <button
              key={locale}
              type="button"
              onClick={(event) => switchTo(event, locale)}
              aria-pressed={isActive}
              className={`flex items-baseline justify-between border-b border-[rgba(242,239,232,0.18)] py-3 text-left font-display text-[22px] tracking-[-0.01em] transition-colors ${
                isActive ? 'text-signal' : 'text-[#F2EFE8] hover:text-signal'
              }`}
            >
              <span>{LOCALE_FULL_NAMES[locale]}</span>
              <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#9CAA98]">
                {LOCALE_LABELS[locale]}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className="hidden md:flex items-center gap-1 font-mono text-[11px] tracking-[0.06em] uppercase"
      role="group"
      aria-label="Choose language"
    >
      {routing.locales.map((locale, index) => {
        const isActive = locale === active;
        return (
          <span key={locale} className="flex items-center">
            <button
              type="button"
              onClick={(event) => switchTo(event, locale)}
              aria-pressed={isActive}
              aria-label={`Switch to ${LOCALE_FULL_NAMES[locale]}`}
              className={`px-1.5 transition-colors ${
                isActive
                  ? 'text-signal'
                  : 'text-current opacity-70 hover:opacity-100 hover:text-signal'
              }`}
            >
              {LOCALE_LABELS[locale]}
            </button>
            {index < routing.locales.length - 1 ? (
              <span aria-hidden="true" className="opacity-30">
                ·
              </span>
            ) : null}
          </span>
        );
      })}
    </div>
  );
}
