import { ProductCard } from '@/components/ui/ProductCard';

import type { ManifestProduct } from '@/lib/types/product';
import type { ReactElement } from 'react';

type ProductGridProps = {
  readonly products: readonly ManifestProduct[];
};

// Pure presentational grid. Filtering / sorting happen upstream in the route
// component — the grid receives the resolved list and renders it.
//
// Visual: 1px ink-12 grid rules between cells; same chrome as the legacy
// `deploy/dossiers.html` `.grid` block. One column on mobile, two on tablet,
// three on desktop.
export function ProductGrid({ products }: ProductGridProps): ReactElement {
  if (products.length === 0) {
    return (
      <div className="border-y border-[rgba(11,15,14,0.12)] bg-[#F2EFE8] px-5 md:px-10 py-24 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#5C6B5A]">
          No dossiers in this collection yet.
        </p>
      </div>
    );
  }
  return (
    <div
      role="list"
      className="grid grid-cols-1 gap-px border-b border-[rgba(11,15,14,0.12)] bg-[rgba(11,15,14,0.12)] md:grid-cols-2 lg:grid-cols-3"
    >
      {products.map((product, index) => (
        <div key={product.handle} role="listitem" className="contents">
          <ProductCard product={product} dossierNumber={index + 1} />
        </div>
      ))}
    </div>
  );
}
