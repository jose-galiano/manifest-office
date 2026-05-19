// Root layout. Next.js requires this file to exist when an `app/` directory
// is present, even when every routable page lives under `app/[locale]/`.
// The middleware redirects any bare path to the matching locale prefix, so
// this layout is reached only for transient pre-redirect states — it stays
// as a pass-through. The actual html/body wrapper, fonts, providers, and
// global UI all live in `app/[locale]/layout.tsx`.

import type { ReactElement, ReactNode } from 'react';

import './globals.css';

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>): ReactElement {
  return children as ReactElement;
}
