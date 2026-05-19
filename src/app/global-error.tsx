/**
 * Top-level error boundary. Renders the entire `<html>` because it activates
 * BEFORE the root layout — when the root layout itself is the thing that
 * crashes. Kept intentionally minimal: no fonts, no design-system tokens,
 * no client-side stores. If we get this far, the platform is in a bad state
 * and we want to render *something* without depending on anything else.
 *
 * No next-intl: this boundary sits outside the [locale] segment, so the
 * message provider is unavailable. We sniff the locale from the path or the
 * NEXT_LOCALE cookie and pick a hardcoded copy table.
 */

'use client';

import { useEffect, useState } from 'react';

import type { ReactElement } from 'react';

export type GlobalErrorProps = {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
};

type Lang = 'en' | 'es' | 'pt' | 'zh';

type Copy = {
  readonly htmlLang: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly body: string;
  readonly retry: string;
};

const COPY: Record<Lang, Copy> = {
  en: {
    htmlLang: 'en',
    eyebrow: 'SYSTEM · OFFLINE',
    title: 'Manifest Office is briefly offline.',
    body: 'The page failed to render. Refresh in a moment, or try again later. If you reached this page through a saved link, the link is still valid — the system itself is the issue.',
    retry: 'Try again →',
  },
  es: {
    htmlLang: 'es',
    eyebrow: 'SISTEMA · FUERA DE LÍNEA',
    title: 'Manifest Office está brevemente fuera de línea.',
    body: 'La página no pudo renderizarse. Recarga en unos instantes o inténtalo más tarde. Si llegaste por un enlace guardado, el enlace sigue siendo válido: el problema está en el sistema.',
    retry: 'Reintentar →',
  },
  pt: {
    htmlLang: 'pt',
    eyebrow: 'SISTEMA · OFFLINE',
    title: 'O Manifest Office está brevemente offline.',
    body: 'A página falhou ao renderizar. Atualiza dentro de momentos ou tenta mais tarde. Se chegaste através de um link guardado, o link continua válido: o problema é do sistema.',
    retry: 'Tentar novamente →',
  },
  zh: {
    htmlLang: 'zh',
    eyebrow: '系统 · 离线',
    title: 'Manifest Office 暂时离线。',
    body: '页面渲染失败。请稍后刷新或再试一次。若您通过已保存的链接进入,该链接仍然有效——问题出在系统本身。',
    retry: '重试 →',
  },
};

function detectLang(): Lang {
  if (typeof window === 'undefined') return 'en';
  const path = window.location.pathname;
  const seg = path.split('/')[1];
  if (seg === 'es' || seg === 'pt' || seg === 'zh' || seg === 'en') return seg;
  const cookieLocale = document.cookie
    .split('; ')
    .find((c) => c.startsWith('NEXT_LOCALE='))
    ?.split('=')[1];
  if (cookieLocale === 'es' || cookieLocale === 'pt' || cookieLocale === 'zh') return cookieLocale;
  return 'en';
}

export default function GlobalError({ error, reset }: GlobalErrorProps): ReactElement {
  const [lang, setLang] = useState<Lang>('en');
  useEffect(() => {
    setLang(detectLang());
    console.error('[global-error]', { digest: error.digest, message: error.message });
  }, [error]);

  const t = COPY[lang];

  return (
    <html lang={t.htmlLang}>
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
          {t.eyebrow}
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
          {t.title}
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
          {t.body}
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
          {t.retry}
        </button>
      </body>
    </html>
  );
}
