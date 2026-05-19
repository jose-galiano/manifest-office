'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import { Eyebrow } from '@/components/ui/Eyebrow';

import type { ReactElement } from 'react';

// Three-line manifesto from deploy/index.html. Each line slides up from
// translate-y-full to translate-y-0 with staggered delays once the section
// crosses the viewport threshold. Self-contained client component — the
// section-level reveal-trigger here is needed because the manifesto sits
// at the top of the page-2 fold and must NOT animate until the user actually
// arrives at it.

export function Manifesto(): ReactElement {
  const t = useTranslations('manifesto');
  const lines: readonly { text: string; accent?: string; tail?: string }[] = [
    { text: t('line_1') },
    { text: t('line_2_prefix'), accent: t('line_2_accent'), tail: t('line_2_tail') },
    { text: t('line_3') },
  ];
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState<boolean>(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          setInView(true);
          observer.unobserve(element);
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className="border-t border-[rgba(11,15,14,0.12)] bg-[#F2EFE8] px-5 md:px-10 py-20 md:py-[160px]"
    >
      <div className="mx-auto max-w-[1100px]">
        <Eyebrow className="mb-8 block">{t('eyebrow').toUpperCase()}</Eyebrow>
        <h2 className="font-display font-bold leading-[1] tracking-[-0.02em] text-[#0B0F0E] text-[clamp(48px,6vw,88px)]">
          {lines.map((line, lineIndex) => (
            <span key={line.text} className="block overflow-hidden">
              <span
                className={`inline-block transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  inView ? 'translate-y-0' : 'translate-y-[110%]'
                }`}
                style={{ transitionDelay: `${lineIndex * 120}ms` }}
              >
                {line.text}
                {line.accent ? <span className="text-signal">{line.accent}</span> : null}
                {line.tail}
              </span>
            </span>
          ))}
        </h2>
      </div>
    </section>
  );
}
