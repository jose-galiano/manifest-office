'use client';

import { useEffect } from 'react';

import { CONSENT_GRANTED_EVENT, readStoredConsent } from '@/lib/analytics/consent';

import type { ReactElement } from 'react';

const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID?.trim();

declare global {
  interface Window {
    clarity?: ((...args: unknown[]) => void) & { q?: unknown[] };
  }
}

function injectClarity(id: string): void {
  if (typeof window === 'undefined') return;
  if (typeof window.clarity === 'function') return;
  const queue: unknown[] = [];
  const stub: Window['clarity'] = Object.assign(
    (...args: unknown[]) => {
      queue.push(args);
    },
    { q: queue },
  );
  window.clarity = stub;
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.clarity.ms/tag/${id}`;
  document.head.appendChild(script);
}

export function ClarityLoader(): ReactElement | null {
  useEffect(() => {
    if (!CLARITY_ID) return;
    if (readStoredConsent() === 'granted') {
      injectClarity(CLARITY_ID);
      return;
    }
    const onGrant = (): void => injectClarity(CLARITY_ID);
    window.addEventListener(CONSENT_GRANTED_EVENT, onGrant, { once: true });
    return () => window.removeEventListener(CONSENT_GRANTED_EVENT, onGrant);
  }, []);

  return null;
}
