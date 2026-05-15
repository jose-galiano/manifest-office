/**
 * Top-level error boundary. Renders the entire `<html>` because it activates
 * BEFORE the root layout — when the root layout itself is the thing that
 * crashes. Kept intentionally minimal: no fonts, no design-system tokens,
 * no client-side stores. If we get this far, the platform is in a bad state
 * and we want to render *something* without depending on anything else.
 *
 * In practice this path is rare. The route-level `error.tsx` catches the
 * vast majority of crashes inside the rendered tree.
 */

'use client';

import { useEffect } from 'react';

import type { ReactElement } from 'react';

export type GlobalErrorProps = {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps): ReactElement {
  useEffect(() => {
    console.error('[global-error]', { digest: error.digest, message: error.message });
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '4rem 1.5rem',
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          color: '#0B0F0E',
          backgroundColor: '#F2EFE8',
          textAlign: 'center',
        }}
      >
        <span
          style={{
            marginBottom: '1rem',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: '11px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#D24A1F',
          }}
        >
          SYSTEM · OFFLINE
        </span>
        <h1
          style={{
            margin: 0,
            maxWidth: '24ch',
            fontSize: 'clamp(40px, 6vw, 80px)',
            fontWeight: 700,
            lineHeight: 0.95,
            letterSpacing: '-0.02em',
          }}
        >
          Manifest Office is briefly offline.
        </h1>
        <p
          style={{
            marginTop: '1.5rem',
            maxWidth: '48ch',
            fontSize: '15px',
            lineHeight: 1.55,
            opacity: 0.85,
          }}
        >
          The page failed to render. Refresh in a moment, or try again later. If you reached this
          page through a saved link, the link is still valid — the system itself is the issue.
        </p>
        {error.digest ? (
          <code
            style={{
              marginTop: '1.5rem',
              padding: '0.5rem 0.75rem',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: '11px',
              letterSpacing: '0.08em',
              backgroundColor: 'rgba(11,15,14,0.08)',
              color: 'rgba(11,15,14,0.7)',
            }}
          >
            ref · {error.digest}
          </code>
        ) : null}
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: '2.5rem',
            padding: '1rem 1.5rem',
            backgroundColor: '#0B0F0E',
            color: '#F2EFE8',
            border: 0,
            cursor: 'pointer',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: '12px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          Try again →
        </button>
      </body>
    </html>
  );
}
