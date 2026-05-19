/**
 * `<PdpDossierBody />` — long-form dossier copy block.
 *
 * Wave-3A slot: each product will own a per-handle dossier body (provenance,
 * field notes, operator credentials) in Wave 4. Until that data layer
 * lands the component renders a typographic placeholder so the page still
 * reads as a complete dossier rather than a half-built shell.
 */

import { getTranslations } from 'next-intl/server';

import type { ReactElement } from 'react';

export type PdpDossierBodyProps = {
  /** Storefront handle used for the eyebrow ordinal copy. */
  readonly title: string;
  /** Rich dossier body when authored (Wave 4). Null falls back to the placeholder. */
  readonly body?: string | null;
};

export async function PdpDossierBody({ title, body }: PdpDossierBodyProps): Promise<ReactElement> {
  const t = await getTranslations('pdp');
  const placeholder = t('dossier_body', { title });

  return (
    <section className="border-t border-[rgba(11,15,14,0.12)] px-5 md:px-10 py-24 md:py-32">
      <div className="mx-auto max-w-[1100px]">
        <span className="mb-4 block font-mono text-[11px] uppercase tracking-[0.08em] text-signal">
          {t('dossier_eyebrow').toUpperCase()}
        </span>
        <p className="max-w-[60ch] text-[17px] leading-[1.55] text-[#0B0F0E]/85">
          {body ?? placeholder}
        </p>
      </div>
    </section>
  );
}
