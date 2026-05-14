import { notFound } from 'next/navigation';

import type { ReactElement } from 'react';

// `/blogs/:blog/:article` — single article route. Reserved for future use.
// No articles exist yet; any handle returns 404 so the URL structure is
// claimed without dead content surfacing.
//
// TODO Agent-B: when src/content/manifest-office.ts ships an OPERATOR_NOTES
// array, render the matching entry here and wire generateStaticParams over
// the resulting tuples.

export default async function BlogArticlePage(): Promise<ReactElement> {
  notFound();
}
