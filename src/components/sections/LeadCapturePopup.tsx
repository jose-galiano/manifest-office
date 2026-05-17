'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useId, useState } from 'react';

import { CUSTOM_EVENTS, ECOMMERCE_EVENTS, track } from '@/lib/analytics';
import { validateEmail } from '@/lib/utils/email';

import type { FormEvent, ReactElement } from 'react';

const DISMISS_KEY = 'mo_lead_dismissed';
const SUBMIT_KEY = 'mo_lead_submitted';
const MOBILE_PDP_DWELL_MS = 30_000;
const BOOK_CALL_HREF = 'https://www.maelify.com/pages/book';

type ShowReason = 'exit_intent' | 'pdp_dwell' | 'manual';

function readSessionFlag(key: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.sessionStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function writeSessionFlag(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(key, '1');
  } catch {
    /* private mode */
  }
}

function isCoarsePointer(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(pointer: coarse)').matches;
}

export function LeadCapturePopup(): ReactElement | null {
  const pathname = usePathname();
  const inputId = useId();
  const [open, setOpen] = useState<boolean>(false);
  const [reason, setReason] = useState<ShowReason | null>(null);
  const [email, setEmail] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const suppressed =
    pathname.startsWith('/checkout') ||
    pathname.startsWith('/thank-you') ||
    readSessionFlag(DISMISS_KEY) ||
    readSessionFlag(SUBMIT_KEY);

  const triggerOpen = useCallback(
    (next: ShowReason): void => {
      if (suppressed) return;
      setReason(next);
      setOpen(true);
      track(CUSTOM_EVENTS.leadPopupOpen, {
        params: { trigger: next, page_path: pathname },
      });
    },
    [pathname, suppressed],
  );

  useEffect(() => {
    if (suppressed) return;
    if (isCoarsePointer()) return;
    const handler = (event: PointerEvent): void => {
      if (event.clientY <= 4 && event.movementY < 0) {
        triggerOpen('exit_intent');
      }
    };
    document.addEventListener('pointermove', handler);
    return () => document.removeEventListener('pointermove', handler);
  }, [suppressed, triggerOpen]);

  useEffect(() => {
    if (suppressed) return;
    if (!isCoarsePointer()) return;
    if (!pathname.startsWith('/products/')) return;
    const handle = window.setTimeout(() => triggerOpen('pdp_dwell'), MOBILE_PDP_DWELL_MS);
    return () => window.clearTimeout(handle);
  }, [pathname, suppressed, triggerOpen]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setOpen(false);
        writeSessionFlag(DISMISS_KEY);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const handleClose = useCallback((): void => {
    setOpen(false);
    writeSessionFlag(DISMISS_KEY);
    track(CUSTOM_EVENTS.leadPopupDismiss, {
      params: { trigger: reason ?? 'unknown', page_path: pathname },
    });
  }, [pathname, reason]);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>): void => {
      event.preventDefault();
      const validation = validateEmail(email);
      if (!validation.ok) {
        setError(
          validation.reason === 'typo'
            ? 'Looks like a typo in the domain — double-check the TLD.'
            : 'Please enter a valid email.',
        );
        return;
      }
      setError(null);
      const cleaned = validation.email;
      track('portfolio_lead_captured', {
        params: { source: reason ?? 'unknown', page_path: pathname },
        fanout: { klaviyo: true, email: cleaned },
      });
      track(ECOMMERCE_EVENTS.generateLead, {
        params: { method: 'lead_popup', source: reason ?? 'unknown' },
        fanout: { klaviyo: true, email: cleaned },
      });
      writeSessionFlag(SUBMIT_KEY);
      setSubmitted(true);
    },
    [email, pathname, reason],
  );

  const handleBookCall = useCallback((): void => {
    track('portfolio_book_call_clicked', {
      params: { source: reason ?? 'unknown', page_path: pathname },
    });
    writeSessionFlag(SUBMIT_KEY);
  }, [pathname, reason]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${inputId}-heading`}
      className="fixed inset-0 z-[1000] flex items-end justify-center sm:items-center sm:p-6"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={handleClose}
        className="absolute inset-0 bg-[rgba(11,15,14,0.55)] backdrop-blur-[2px] cursor-default"
      />

      <div className="relative w-full max-w-[480px] bg-[var(--color-paper)] text-[var(--color-ink)] shadow-[0_24px_60px_-24px_rgba(0,0,0,0.45)]">
        <button
          type="button"
          aria-label="Close"
          onClick={handleClose}
          className="absolute right-4 top-4 z-10 h-9 w-9 font-mono text-[14px] uppercase tracking-[0.06em] text-[var(--color-lichen)] transition-colors hover:text-[var(--color-ink)]"
        >
          ×
        </button>

        <div className="px-7 py-9 sm:px-9 sm:py-11">
          <span className="block font-mono text-[10px] tracking-[0.14em] uppercase text-[var(--color-signal)]">
            BUILT BY MAELIFY
          </span>
          <h2
            id={`${inputId}-heading`}
            className="mt-3 font-display text-[28px] font-medium leading-[1.05] tracking-[-0.015em] sm:text-[34px]"
          >
            {submitted ? 'Got it. I’ll be in touch.' : 'Like what you’re seeing?'}
          </h2>

          {!submitted ? (
            <p className="mt-4 text-[15px] leading-[1.55] text-[var(--color-ink)]/85">
              This whole storefront is a portfolio piece. Shopify Plus, Next.js 15, agentic-commerce
              schema, multi-agent Claude Code build. The same stack can elevate your brand into a
              storefront that people remember and that converts. Leave an email, or book a call.
            </p>
          ) : (
            <p className="mt-4 text-[15px] leading-[1.55] text-[var(--color-ink)]/85">
              Thanks. I&apos;ll reach out within a business day with a few questions and a short
              recommendation on where headless gets you the biggest unlock. Meanwhile, the rest of
              the demo is yours to poke at.
            </p>
          )}

          {!submitted ? (
            <form onSubmit={handleSubmit} noValidate className="mt-7 flex flex-col gap-3">
              <div className="flex items-stretch border border-[var(--color-rule-strong)] focus-within:border-[var(--color-ink)]">
                <label htmlFor={inputId} className="sr-only">
                  Email
                </label>
                <input
                  id={inputId}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  placeholder="your.email@company.com"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError(null);
                  }}
                  aria-invalid={error !== null}
                  className="flex-1 border-0 bg-transparent px-4 py-[14px] font-mono text-[14px] tracking-[0.02em] text-[var(--color-ink)] outline-none placeholder:text-[var(--color-lichen)] focus:bg-[rgba(11,15,14,0.02)]"
                />
              </div>
              {error ? (
                <p
                  role="alert"
                  className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-signal)]"
                >
                  {error}
                </p>
              ) : null}
              <button
                type="submit"
                className="w-full bg-[var(--color-ink)] px-4 py-[16px] font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-paper)] transition-[background-color,letter-spacing] duration-[280ms] ease-out hover:bg-[var(--color-signal)] hover:tracking-[0.18em]"
              >
                Send me a note
              </button>
              <Link
                href={BOOK_CALL_HREF}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleBookCall}
                className="text-center font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-ink)] underline decoration-[var(--color-rule-strong)] underline-offset-[6px] transition-colors hover:text-[var(--color-signal)] hover:decoration-[var(--color-signal)]"
              >
                Or book a 30-min call →
              </Link>
            </form>
          ) : (
            <div className="mt-7 flex flex-col gap-3">
              <Link
                href={BOOK_CALL_HREF}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleBookCall}
                className="w-full text-center bg-[var(--color-ink)] px-4 py-[16px] font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-paper)] transition-[background-color,letter-spacing] duration-[280ms] ease-out hover:bg-[var(--color-signal)] hover:tracking-[0.18em]"
              >
                Book a 30-min call →
              </Link>
              <button
                type="button"
                onClick={handleClose}
                className="text-center font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-lichen)] transition-colors hover:text-[var(--color-ink)]"
              >
                Keep exploring
              </button>
            </div>
          )}

          <p className="mt-7 font-mono text-[10px] tracking-[0.06em] uppercase text-[var(--color-lichen)]">
            Jose Galiano · Shopify Agentic Commerce Architect · maelify.com
          </p>
        </div>
      </div>
    </div>
  );
}
