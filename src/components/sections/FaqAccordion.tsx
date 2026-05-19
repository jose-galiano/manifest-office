'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import type { ReactElement } from 'react';

const FAQ_KEYS = [
  'shipping',
  'returns',
  'engraving',
  'edition',
  'repair',
  'sizing',
  'duties',
  'materials',
  'support',
] as const;

type FaqKey = (typeof FAQ_KEYS)[number];

export function FaqAccordion(): ReactElement {
  const t = useTranslations('faq');
  const [open, setOpen] = useState<FaqKey | null>(FAQ_KEYS[0]);

  return (
    <ul className="divide-y divide-[rgba(11,15,14,0.10)] border-t border-b border-[rgba(11,15,14,0.10)]">
      {FAQ_KEYS.map((key, index) => {
        const isOpen = open === key;
        return (
          <li key={key}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : key)}
              aria-expanded={isOpen}
              aria-controls={`faq-panel-${key}`}
              className="grid w-full grid-cols-[auto_1fr_auto] items-baseline gap-5 py-6 text-left transition-colors hover:text-signal"
            >
              <span
                aria-hidden="true"
                className="font-mono text-[11px] tabular-nums uppercase tracking-[0.08em] text-[var(--color-lichen)]"
              >
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="font-display text-[20px] font-medium leading-[1.25] tracking-[-0.01em] text-[var(--color-ink)] md:text-[24px]">
                {t(`items.${key}.q`)}
              </span>
              <span
                aria-hidden="true"
                className={`flex h-6 w-6 items-center justify-center font-mono text-[18px] leading-none text-[var(--color-ink)] transition-transform duration-300 ${
                  isOpen ? 'rotate-45' : ''
                }`}
              >
                +
              </span>
            </button>
            <div
              id={`faq-panel-${key}`}
              role="region"
              aria-hidden={!isOpen}
              className={`grid transition-[grid-template-rows,opacity] duration-400 ease-out ${
                isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="overflow-hidden">
                <p className="ml-[44px] max-w-[64ch] pb-7 pr-6 text-[15px] leading-[1.65] text-[var(--color-ink)]/85">
                  {t(`items.${key}.a`)}
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
