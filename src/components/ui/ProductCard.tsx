import Image from 'next/image';
import Link from 'next/link';

import { ENGRAVING_UPCHARGE_EUR, hasEngravingOption } from '@/lib/constants/engraving';
import { toStorefrontHandle } from '@/lib/shopify/handle';

import type { ManifestProduct } from '@/lib/types/product';
import type { ReactElement } from 'react';

type ProductCardProps = {
  readonly product: ManifestProduct;
  readonly dossierNumber: number;
};

function formatPrice(amount: number): string {
  return `€${Math.round(amount)}`;
}

function formatAllocation(issued: number, total: number): string {
  const safeTotal = total > 0 ? total : 1200;
  return `${String(issued).padStart(3, '0')} / ${safeTotal}`;
}

// PLP card. Brand chrome:
//   • Paper background with a 1px ink-12 rule between cells.
//   • Dossier index + allocation badge sit above the image.
//   • Hover scales the image; the card itself is a single anchor.
//   • Tailwind only — colour tokens are arbitrary values pinned to the
//     Manifest Office palette in the brand bible.
export function ProductCard({ product, dossierNumber }: ProductCardProps): ReactElement {
  const storefrontHandle = toStorefrontHandle(product.handle);
  const heroImage = product.image ?? product.images[0]?.url ?? '';
  const dossierLabel = `DOSSIER ${String(dossierNumber).padStart(2, '0')}`;
  const allocationLabel = formatAllocation(product.editionIssued, product.editionTotal);
  const presentationLabel = product.volume ? `${product.volume}` : '';
  const showsEngraving = hasEngravingOption(product.handle);

  return (
    <Link
      href={`/products/${storefrontHandle}`}
      className="group relative block bg-[#F2EFE8] transition-colors duration-300 hover:bg-[rgba(11,15,14,0.03)]"
      data-cursor
    >
      <span className="pointer-events-none absolute left-6 top-6 z-10 font-mono text-[11px] uppercase tracking-[0.06em] text-[#5C6B5A]">
        {dossierLabel}
      </span>
      <span className="pointer-events-none absolute right-6 top-6 z-10 font-mono text-[10px] uppercase tracking-[0.06em] text-[#D24A1F]">
        {allocationLabel}
      </span>

      <div className="aspect-[4/5] overflow-hidden bg-[#eae5dc]">
        {heroImage ? (
          <Image
            src={heroImage}
            alt={product.title}
            width={800}
            height={1000}
            sizes="(max-width: 820px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="h-full w-full object-cover transition-transform duration-[1000ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
          />
        ) : null}
      </div>

      <div className="flex items-start justify-between gap-4 border-t border-[rgba(11,15,14,0.12)] px-7 py-6">
        <div className="flex flex-col gap-1.5">
          {presentationLabel ? (
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#5C6B5A]">
              {presentationLabel}
            </span>
          ) : null}
          <h3 className="font-display text-[26px] font-bold leading-none tracking-tight text-[#0B0F0E]">
            {product.title}
          </h3>
          {product.colorways.length > 0 ? (
            <div className="mt-3 flex gap-1.5">
              {product.colorways.map((hex) => (
                <span
                  key={hex}
                  aria-hidden="true"
                  className="h-3.5 w-3.5 rounded-full border border-[rgba(11,15,14,0.35)]"
                  style={{ background: hex }}
                />
              ))}
            </div>
          ) : null}
        </div>
        <div className="text-right">
          <div className="font-mono text-[14px] font-medium text-[#0B0F0E]">
            {formatPrice(product.price)}
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.06em] text-[#5C6B5A]">
            EUR · INCL VAT
          </div>
          {showsEngraving ? (
            <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.08em] text-[#5C6B5A]">
              +€{ENGRAVING_UPCHARGE_EUR} ENGRAVING
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
