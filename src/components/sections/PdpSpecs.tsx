/**
 * `<PdpSpecs />` — six-cell horizontal spec strip below the hero. Mirrors
 * the legacy `<section class="specs">` (deploy/pdp.html lines 826-833).
 *
 * Icon SVGs are ported verbatim from the source — same `viewBox` and path
 * geometry — to preserve the brand bible's hand-drawn line vocabulary.
 * Values are derived from the catalogue entry plus Shopify product data so
 * the same component renders for every dossier.
 */

import type { ReactElement, SVGProps } from 'react';

export type PdpSpec = {
  /** Icon key — selects one of the inline SVGs below. */
  readonly icon: 'material' | 'closure' | 'zipper' | 'volume' | 'mass' | 'origin';
  readonly label: string;
  readonly value: string;
};

type IconComponent = (props: SVGProps<SVGSVGElement>) => ReactElement;

function MaterialIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <rect x="3" y="6" width="18" height="14" rx="1" />
      <path d="M3 10h18" />
    </svg>
  );
}

function ClosureIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M4 8h16M4 16h16M8 4v16M16 4v16" />
    </svg>
  );
}

function ZipperIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

function VolumeIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <rect x="5" y="3" width="14" height="18" rx="1" />
      <path d="M9 7h6M9 11h6M9 15h4" />
    </svg>
  );
}

function MassIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M3 12h18M12 3v18" />
    </svg>
  );
}

function OriginIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M4 4l16 16M4 20L20 4" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

const ICON_MAP: Record<PdpSpec['icon'], IconComponent> = {
  material: MaterialIcon,
  closure: ClosureIcon,
  zipper: ZipperIcon,
  volume: VolumeIcon,
  mass: MassIcon,
  origin: OriginIcon,
};

export type PdpSpecsProps = {
  readonly specs: readonly PdpSpec[];
};

export function PdpSpecs({ specs }: PdpSpecsProps): ReactElement {
  return (
    <section
      aria-label="Specifications"
      className="grid grid-cols-2 border-y border-[rgba(11,15,14,0.12)] md:grid-cols-3 lg:grid-cols-6"
    >
      {specs.map((spec, index) => {
        const Icon = ICON_MAP[spec.icon];
        const isLastInRow = (index + 1) % 6 === 0;
        return (
          <div
            key={spec.label}
            className={`flex flex-col gap-2 border-b border-[rgba(11,15,14,0.12)] px-5 py-7 lg:border-b-0 ${
              isLastInRow ? '' : 'lg:border-r lg:border-[rgba(11,15,14,0.12)]'
            }`}
          >
            <Icon className="h-[22px] w-[22px] text-[#0B0F0E]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#5C6B5A]">
              {spec.label}
            </span>
            <span className="font-display text-[18px] font-medium tracking-[-0.01em] text-[#0B0F0E]">
              {spec.value}
            </span>
          </div>
        );
      })}
    </section>
  );
}
