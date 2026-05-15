/**
 * Minimal Consent Mode v2 banner.
 *
 * Sits fixed at the bottom of the viewport until the user accepts or
 * declines. Choice persists in localStorage so it never re-appears on the
 * same browser. Brand-aligned: paper background, ink type, signal-orange
 * primary action, mono accent (matches Manifest Office §08 type scale).
 *
 * Intentionally lightweight: a real CMP can replace this later via a GTM
 * template without changing the call sites — Consent Mode v2 commands
 * stay identical.
 */

'use client';

import { useEffect, useState } from 'react';

import {
  CUSTOM_EVENTS,
  denyConsent,
  grantConsent,
  readStoredConsent,
  track,
} from '@/lib/analytics';

import type { ReactElement } from 'react';

export function ConsentBanner(): ReactElement | null {
  const [hydrated, setHydrated] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setHydrated(true);
    setVisible(readStoredConsent() === null);
  }, []);

  if (!hydrated || !visible) return null;

  function handleAccept(): void {
    grantConsent();
    track(CUSTOM_EVENTS.consentGranted);
    setVisible(false);
  }

  function handleDecline(): void {
    denyConsent();
    track(CUSTOM_EVENTS.consentDenied);
    setVisible(false);
  }

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-2xl rounded-sm border border-[#0B0F0E]/12 bg-[var(--color-paper)] p-5 shadow-[0_8px_28px_rgba(0,0,0,0.18)] backdrop-blur md:bottom-6 md:p-6"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#D24A1F]">Privacy</p>
      <p className="mt-2 text-[13px] leading-relaxed text-[#0B0F0E]">
        Manifest Office uses cookies for analytics so we can understand how the system is browsed
        and improve the experience. No personal data is sold. You can change this any time.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleAccept}
          data-track="consent_accept"
          className="border border-[var(--color-signal)] bg-[var(--color-signal)] px-5 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-paper)] transition-colors duration-200 hover:bg-transparent hover:text-[var(--color-signal)]"
        >
          Accept
        </button>
        <button
          type="button"
          onClick={handleDecline}
          data-track="consent_decline"
          className="border border-[#0B0F0E]/30 px-5 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[#0B0F0E] transition-colors duration-200 hover:border-[#0B0F0E]"
        >
          Decline
        </button>
      </div>
    </div>
  );
}
