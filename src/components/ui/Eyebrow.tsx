import type { ReactElement, ReactNode } from 'react';

// Mono-serif uppercase eyebrow used across hero blocks and section heads.
// Brand bible §05: 11px JetBrains Mono, 0.1–0.2em tracking, signal-orange.
interface EyebrowProps {
  children: ReactNode;
  className?: string;
  /** Decorative em-dashes wrapping the label (default false to honour the "no em-dashes" rule in body copy; legacy hero blocks render them as ornamentation). */
  flanked?: boolean;
}

export function Eyebrow({ children, className = '', flanked = false }: EyebrowProps): ReactElement {
  const label = flanked ? `— ${children} —` : children;
  return (
    <span
      className={`font-mono text-[11px] tracking-[0.18em] uppercase text-[#D24A1F] ${className}`}
    >
      {label}
    </span>
  );
}
