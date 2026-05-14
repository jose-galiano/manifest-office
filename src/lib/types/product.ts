// Product DTOs returned by `/api/products`. Mirrors the shape the legacy
// `deploy/api/products.js` produced so the existing storefront code can be
// ported without breaking the client contract.

export type ProductImage = {
  url: string;
  alt: string;
};

export type SelectedOption = {
  name: string;
  value: string;
};

export type ProductVariant = {
  id: string;
  title: string;
  inventoryQty: number | null;
  selectedOptions: SelectedOption[];
  image: string | null;
};

export type ManifestProduct = {
  id: string;
  handle: string;
  title: string;
  price: number;
  currency: string;
  image: string | null;
  images: ProductImage[];
  colorways: string[];
  variants: ProductVariant[];
  volume: string;
  editionTotal: number;
  editionIssued: number;
  edition: string;
  sku: string;
  variantId: string | null;
  inventoryQty: number | null;
};

export type ProductsResponse = {
  products: ManifestProduct[];
  fetched_at: string;
};
