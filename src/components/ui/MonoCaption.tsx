import type { ReactElement, ReactNode } from 'react';

// Monospaced caption used for meta strips, dossier counters, key-value labels.
// Brand bible §05: 11px JetBrains Mono, 0.04–0.08em tracking, lichen-grey.
interface MonoCaptionProps {
  children: ReactNode;
  className?: string;
  tone?: 'lichen' | 'paper' | 'signal' | 'ink';
}

const toneClass: Record<NonNullable<MonoCaptionProps['tone']>, string> = {
  lichen: 'text-[#5C6B5A]',
  paper: 'text-[#F2EFE8]',
  signal: 'text-[#D24A1F]',
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
