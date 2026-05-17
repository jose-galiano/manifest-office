import type { ReactElement, ReactNode } from 'react';

// Monospaced caption used for meta strips, dossier counters, key-value labels.
// Brand bible §05: 11px JetBrains Mono, 0.04–0.08em tracking, lichen-grey.
interface MonoCaptionProps {
  children: ReactNode;
  className?: string;
  tone?: 'lichen' | 'lichen-on-ink' | 'paper' | 'signal' | 'ink';
}

// `lichen-on-ink` is the WCAG-AA-passing variant for lichen text rendered
// over the ink (#0B0F0E) background. Standard lichen #5C6B5A is ~3.5:1 on
// ink — below 4.5:1 normal-text. #9CAA98 lifts it to ~6.6:1.
const toneClass: Record<NonNullable<MonoCaptionProps['tone']>, string> = {
  lichen: 'text-[#5C6B5A]',
  'lichen-on-ink': 'text-[#9CAA98]',
  paper: 'text-[#F2EFE8]',
  signal: 'text-signal',
  ink: 'text-[#0B0F0E]',
};

export function MonoCaption({
  children,
  className = '',
  tone = 'lichen',
}: MonoCaptionProps): ReactElement {
  return (
    <span
      className={`font-mono text-[11px] tracking-[0.06em] uppercase ${toneClass[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
