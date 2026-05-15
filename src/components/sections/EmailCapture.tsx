/**
 * `<EmailCapture />` — quiet bottom-of-page email capture.
 *
 * Posts to `/api/track` with event `Manifest Email Saved` (the same Klaviyo
 * event the cart drawer fires) so the existing flow handles double opt-in,
 * welcome sequence, and Edition 02 notification. Stores the address in
 * localStorage so the cart drawer pre-fills on the same device.
 *
 * Muji discipline: one input, one button, one mono caption. No "JOIN THE
 * CLUB" theatre, no discount-bribe overlay, no privacy footnote in 6px gray.
 */

'use client';

import { useCallback, useState } from 'react';

import { CUSTOM_EVENTS, ECOMMERCE_EVENTS, track } from '@/lib/analytics';
import { validateEmail } from '@/lib/utils/email';

import type { FormEvent, ReactElement } from 'react';

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

export function EmailCapture(): ReactElement {
  const [email, setEmail] = useState<string>('');
  const [state, setState] = useState<SubmitState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>): Promise<void> => {
      event.preventDefault();
      const validation = validateEmail(email);
      if (!validation.ok) {
        setState('error');
        setErrorMessage(
          validation.reason === 'typo'
            ? 'Looks like a typo in the domain — double-check the TLD.'
            : 'Please enter a valid email.',
        );
        return;
      }
      const trimmed = validation.email;
      setState('submitting');
      setErrorMessage('');
      try {
        const response = await fetch('/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'Manifest Email Saved',
            email: trimmed,
            properties: {
              source: 'homepage_footer_capture',
              interested_in_edition: '01',
            },
          }),
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        try {
          window.localStorage.setItem('mo_email', trimmed);
        } catch {
          /* private mode / quota — silently drop. */
        }
        track(CUSTOM_EVENTS.emailCaptureSubmit, {
          params: { source: 'homepage_footer_capture' },
        });
        track(ECOMMERCE_EVENTS.generateLead, {
          params: { method: 'email', source: 'homepage_footer_capture' },
        });
        setState('success');
      } catch (err) {
        setState('error');
        setErrorMessage(err instanceof Error ? err.message : 'Network error.');
      }
    },
    [email],
  );

  const isSubmitting = state === 'submitting';
  const isSuccess = state === 'success';

  return (
    <section
      aria-label="Edition 02 notification list"
      className="bg-[#F2EFE8] px-5 md:px-10 py-14 md:py-[100px] text-[#0B0F0E]"
    >
      <div className="mx-auto grid max-w-[1100px] grid-cols-1 items-center gap-12 md:grid-cols-[1fr_1.1fr] md:gap-20">
        <div>
          <span className="mb-4 block font-mono text-[11px] tracking-[0.12em] uppercase text-[#D24A1F]">
            — EDITION 02 · UNNAMED ANCHOR —
          </span>
          <h3 className="font-display font-bold leading-[1] tracking-[-0.02em] text-[clamp(28px,3.5vw,44px)]">
            Be on the desk when the next Edition opens.
          </h3>
          <p className="mt-4 max-w-[44ch] text-[15px] leading-[1.55] text-[#0B0F0E]/65">
            One mail. No newsletter. Quiet until the next 1,200 are about to issue.
          </p>
        </div>

        {isSuccess ? (
          <p
            role="status"
            className="font-mono text-[12px] tracking-[0.08em] uppercase text-[#0B0F0E]"
          >
            ✓ Filed. We&apos;ll be in touch when Edition 02 opens.
          </p>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
            <div className="flex items-stretch border border-[rgba(11,15,14,0.35)] bg-[#F2EFE8] focus-within:border-[#0B0F0E]">
              <label htmlFor="footer-email" className="sr-only">
                Email address
              </label>
              <input
                id="footer-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                spellCheck={false}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@example.com"
                disabled={isSubmitting}
                aria-invalid={state === 'error'}
                aria-describedby={state === 'error' ? 'footer-email-error' : undefined}
                className="flex-1 bg-transparent px-4 py-3 font-mono text-[13px] tracking-[0.04em] outline-none placeholder:text-[#5C6B5A] disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                data-cursor
                className="border-l border-[rgba(11,15,14,0.35)] bg-[#0B0F0E] px-6 py-3 font-mono text-[11px] uppercase tracking-[0.12em] text-[#F2EFE8] transition-[background-color,letter-spacing] duration-[240ms] hover:bg-[#D24A1F] hover:tracking-[0.16em] disabled:opacity-60"
              >
                {isSubmitting ? 'FILING…' : 'NOTIFY ME →'}
              </button>
            </div>
            {state === 'error' ? (
              <p
                id="footer-email-error"
                role="alert"
                className="font-mono text-[10px] tracking-[0.06em] uppercase text-[#D24A1F]"
              >
                {errorMessage || 'Could not submit.'}
              </p>
            ) : (
              <p className="font-mono text-[10px] tracking-[0.06em] uppercase text-[#5C6B5A]">
                We hold the address. We do not sell it.
              </p>
            )}
          </form>
        )}
      </div>
    </section>
  );
}
