// JSON-LD renderer. Emits a plain `<script type="application/ld+json">` in
// the initial HTML — NOT via `next/script`, because Next's loader strategies
// defer the script and most crawlers index the first-paint HTML. JSON-LD
// must ship inline.
//
// `dangerouslySetInnerHTML` is the only React-safe way to inline JSON into a
// script tag; the payload is produced by typed builders, never from user
// input, so escaping concerns are limited to the closing-tag sentinel below.

import type { SchemaOrgGraph } from './types';
import type { ReactElement } from 'react';

type JsonLdProps = {
  readonly schema: SchemaOrgGraph | ReadonlyArray<SchemaOrgGraph>;
  /** Optional stable `id` — useful when multiple schemas live on one page. */
  readonly id?: string;
};

/**
 * Escapes `</script` sequences inside JSON-LD payloads. The builders never
 * emit one today, but a future product description that quotes HTML could.
 */
function safeStringify(input: SchemaOrgGraph | ReadonlyArray<SchemaOrgGraph>): string {
  return JSON.stringify(input).replace(/<\/script/gi, '<\\/script');
}

export function JsonLd({ schema, id }: JsonLdProps): ReactElement {
  return (
    <script
      type="application/ld+json"
      id={id}
      dangerouslySetInnerHTML={{ __html: safeStringify(schema) }}
    />
  );
}
