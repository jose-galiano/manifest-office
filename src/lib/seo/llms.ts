// `llms.txt` builders. The format is documented at https://llmstxt.org —
// a Markdown header + sectioned link list that lets agentic clients ingest a
// site's structure without HTML parsing. Two flavours:
//   - `buildLlmsTxt()`: the compact catalogue (root URL contract).
//   - `buildLlmsFullTxt()`: the extended variant with full descriptions,
//     materials, and policy detail — better-than-spec courtesy.

import {
  COLLECTIONS,
  EDITION_01,
  EDITION_01_PRODUCTS,
  STATIC_PAGES,
} from '@/content/manifest-office';

import { BRAND_DESCRIPTION, BRAND_NAME, SITE_ORIGIN } from './constants';

function formatPrice(value: number): string {
  return `€${value}`;
}

function header(): string {
  return [
    `# ${BRAND_NAME}`,
    '',
    `> ${BRAND_DESCRIPTION}`,
    '',
    `Edition ${EDITION_01.number} — ${EDITION_01.anchor}. ${EDITION_01.totalAllocation.toLocaleString('en-GB')} systems. Issued from ${EDITION_01.issuedFrom}. Ships ${EDITION_01.shipsBy}.`,
    '',
  ].join('\n');
}

export function buildLlmsTxt(): string {
  const lines: string[] = [];
  lines.push(header());

  lines.push('## Catalog');
  lines.push('');
  lines.push(
    `- [Edition 01 — ${EDITION_01.anchor}](${SITE_ORIGIN}/collections/edition-01): the full 10-SKU drop`,
  );
  lines.push(
    `- [All products](${SITE_ORIGIN}/api/products): typed JSON feed with live allocation counters`,
  );
  lines.push(`- [Sitemap](${SITE_ORIGIN}/sitemap.xml)`);
  lines.push('');

  lines.push('## Products');
  lines.push('');
  for (const product of EDITION_01_PRODUCTS) {
    const volume = product.volume && product.volume !== '—' ? `${product.volume} · ` : '';
    lines.push(
      `- [${product.title}](${SITE_ORIGIN}/products/${product.handle}): ${formatPrice(product.priceEur)} · ${volume}${product.use}`,
    );
  }
  lines.push('');

  lines.push('## Collections');
  lines.push('');
  for (const collection of COLLECTIONS) {
    lines.push(`- [${collection.title}](${SITE_ORIGIN}/collections/${collection.handle})`);
  }
  lines.push('');

  lines.push('## Pages');
  lines.push('');
  for (const page of STATIC_PAGES) {
    lines.push(`- [${page.title}](${SITE_ORIGIN}/pages/${page.handle}): ${page.description}`);
  }
  lines.push('');

  lines.push('## Policies');
  lines.push('');
  lines.push('- 30-day returns to Porto');
  lines.push('- Free EU shipping over €150, €8 flat under');
  lines.push('- Hand-finished by Atelier Souto, Vila Nova de Famalicão');
  lines.push('- All hardware closes with the Anchor Latch MO-A1');
  lines.push('');

  return lines.join('\n');
}

export function buildLlmsFullTxt(): string {
  const lines: string[] = [];
  lines.push(header());

  lines.push('## About');
  lines.push('');
  lines.push(
    `${BRAND_NAME} ships a single travel-kit system in finite Editions. Each Edition is anchored to a geographic project, shares one closure (the Anchor Latch MO-A1), and is hand-finished by named practitioners. Edition ${EDITION_01.number} is anchored to the ${EDITION_01.anchor} at ${EDITION_01.coordinates}. The accent is ${EDITION_01.accentName} (${EDITION_01.accentHex}). Guest material: ${EDITION_01.guestMaterial}.`,
  );
  lines.push('');

  lines.push('## Products');
  lines.push('');
  for (const product of EDITION_01_PRODUCTS) {
    lines.push(`### ${product.title}`);
    lines.push('');
    lines.push(`- URL: ${SITE_ORIGIN}/products/${product.handle}`);
    lines.push(`- Price: ${formatPrice(product.priceEur)}`);
    if (product.volume && product.volume !== '—') {
      lines.push(`- Volume: ${product.volume}`);
    }
    lines.push(`- Use: ${product.use}`);
    lines.push(`- Dossier: ${String(product.dossierNumber).padStart(2, '0')}`);
    lines.push(`- Material: 420D Cordura, hand-finished in Porto`);
    lines.push(`- Closure: Anchor Latch MO-A1`);
    lines.push('');
  }

  lines.push('## Collections');
  lines.push('');
  for (const collection of COLLECTIONS) {
    lines.push(`### ${collection.title}`);
    lines.push('');
    lines.push(`- URL: ${SITE_ORIGIN}/collections/${collection.handle}`);
    lines.push(`- Summary: ${collection.summary}`);
    lines.push(`- SKUs: ${collection.productHandles.join(', ')}`);
    lines.push('');
  }

  lines.push('## Pages');
  lines.push('');
  for (const page of STATIC_PAGES) {
    lines.push(`### ${page.title}`);
    lines.push('');
    lines.push(`- URL: ${SITE_ORIGIN}/pages/${page.handle}`);
    lines.push(`- Summary: ${page.description}`);
    lines.push('');
  }

  lines.push('## Agentic commerce');
  lines.push('');
  lines.push(`- Catalogue feed: ${SITE_ORIGIN}/api/products (JSON, live allocation counters)`);
  lines.push(`- Site structure: ${SITE_ORIGIN}/sitemap.xml`);
  lines.push(`- Robots policy: ${SITE_ORIGIN}/robots.txt (AI bots explicitly allowed)`);
  lines.push(
    `- Recommendation desk: POST ${SITE_ORIGIN}/api/desk (rate-limited, Cloudflare-protected)`,
  );
  lines.push('');

  lines.push('## Policies');
  lines.push('');
  lines.push('- 30-day returns to Porto. Customer pays return shipping for changes of mind.');
  lines.push('- Free EU shipping over €150. Flat €8 under threshold. 1–2 day transit within EU.');
  lines.push(
    '- Repair, not replace. Every component carries a lifetime structural warranty against manufacturing defects.',
  );
  lines.push('- Edition cap is finite. When an Edition closes, it stays closed.');
  lines.push('');

  return lines.join('\n');
}
