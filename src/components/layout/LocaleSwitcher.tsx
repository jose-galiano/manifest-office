/**
 * `<LocaleSwitcher />` — compact dropdown picker in the header.
 *
 * Single button shows the current locale code + caret. Click opens a 4-row
 * popover with each language's full name and code. Selecting an entry
 * rewrites the leading URL segment and persists the choice via the
 * NEXT_LOCALE cookie that the middleware reads on subsequent visits.
 *
 * The mobile menu uses the `stack` variant (vertical list, no popover).
 */

'use client';

import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';

import {
  LOCALE_FULL_NAMES,
  LOCALE_LABELS,
  LOCALE_MARKET,
  routing,
  type Locale,
} from '@/i18n/routing';

import type { MouseEvent, ReactElement } from 'react';

type LocaleSwitcherProps = {
  /** `inline` = dropdown chip for desktop. `stack` = full-bleed list for mobile menu. */
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
  const [open, setOpen] = useState<boolean>(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const switchTo = useCallback(
    (event: MouseEvent<HTMLButtonElement>, next: Locale): void => {
      event.preventDefault();
      setOpen(false);
      if (next === active) {
        onSelect?.();
        return;
      }
      if (typeof document !== 'undefined') {
        document.cookie = `NEXT_LOCALE=${next};path=/;max-age=${LOCALE_COOKIE_MAX_AGE};samesite=lax`;
      }
      const target = withLocale(pathname, next);
      startTransition(() => {
        router.replace(target);
        onSelect?.();
      });
    },
    [active, onSelect, pathname, router],
  );

  useEffect(() => {
    if (variant !== 'inline' || !open) return;
    function onDocClick(event: globalThis.MouseEvent): void {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent): void {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, variant]);

  if (variant === 'stack') {
    return (
      <div className="flex flex-col gap-3" aria-label="Choose language">
        {routing.locales.map((locale) => {
          const isActive = locale === active;
          const market = LOCALE_MARKET[locale];
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
                {LOCALE_LABELS[locale]} · {market.currency}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative hidden md:block">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Language — ${LOCALE_FULL_NAMES[active]}`}
        className="inline-flex items-center gap-1.5 px-1.5 py-1 font-mono text-[11px] tracking-[0.06em] uppercase transition-colors hover:text-signal"
      >
        <span>{LOCALE_LABELS[active]}</span>
        <span aria-hidden="true" className="opacity-50">
          ·
        </span>
        <span className="text-[var(--color-signal)]">{LOCALE_MARKET[active].currency}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 12 12"
          width="9"
          height="9"
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <path
            d="M2 4l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div
        role="listbox"
        aria-label="Choose language"
        className={`absolute right-0 top-full z-[700] mt-2 min-w-[180px] origin-top-right rounded-md border border-[var(--color-rule)] bg-[var(--color-paper)] shadow-[0_8px_28px_rgba(11,15,14,0.18)] transition-[opacity,transform] duration-200 ${
          open ? 'visible scale-100 opacity-100' : 'invisible scale-[0.96] opacity-0'
        }`}
      >
        <ul className="py-2">
          {routing.locales.map((locale) => {
            const isActive = locale === active;
            const market = LOCALE_MARKET[locale];
            return (
              <li key={locale}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={(event) => switchTo(event, locale)}
                  className={`flex w-full items-center justify-between gap-6 px-4 py-2.5 text-left transition-colors ${
                    isActive
                      ? 'bg-[rgba(11,15,14,0.04)] text-[var(--color-ink)]'
                      : 'text-[var(--color-ink)] hover:bg-[rgba(11,15,14,0.04)]'
                  }`}
                >
                  <span className="font-display text-[14px] font-medium tracking-[-0.01em]">
                    {LOCALE_FULL_NAMES[locale]}
                  </span>
                  <span
                    className={`font-mono text-[10px] uppercase tracking-[0.08em] ${
                      isActive ? 'text-[var(--color-signal)]' : 'text-[var(--color-lichen)]'
                    }`}
                  >
                    {LOCALE_LABELS[locale]} · {market.currency}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
