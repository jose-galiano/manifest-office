// Orchestrates the Edition 01 catalogue fetch:
//   1. Query Shopify for all 10 handles in one batched request.
//   2. Coerce the GraphQL nodes into the storefront DTO shape.
//   3. Return an ordered array matching the canonical handle list.

import { EDITION_01_HANDLES } from '@/content/manifest-office';
import {
  EDITION_01_DEFAULT_ISSUED,
  EDITION_01_NUMBER,
  EDITION_01_TOTAL,
} from '@/lib/constants/allocation';
import {
  fetchProductsByHandle,
  type ShopifyProductNode,
} from '@/lib/shopify/queries/get-products-with-variants';

import type { ManifestProduct, ProductsResponse } from '@/lib/types/product';

export type FetchProductsSuccess = { ok: true; data: ProductsResponse };
export type FetchProductsFailure = {
  ok: false;
  error: 'shopify_errors' | 'fetch_failed';
  detail?: unknown;
};
export type FetchProductsResult = FetchProductsSuccess | FetchProductsFailure;

export async function fetchManifestProducts(): Promise<FetchProductsResult> {
  try {
    const queryResult = await fetchProductsByHandle(EDITION_01_HANDLES);
    if (!queryResult.ok) {
      return { ok: false, error: 'shopify_errors', detail: queryResult.errors };
    }

    const products: ManifestProduct[] = [];
    for (let i = 0; i < EDITION_01_HANDLES.length; i += 1) {
      const node = queryResult.data[`p${i}`];
      if (!node) {
        continue;
      }
      products.push(mapNodeToProduct(node));
    }

    return {
      ok: true,
      data: {
        products,
        fetched_at: new Date().toISOString(),
      },
    };
  } catch (caught) {
    return {
      ok: false,
      error: 'fetch_failed',
      detail: caught instanceof Error ? caught.message : 'unknown_error',
    };
  }
}

function mapNodeToProduct(node: ShopifyProductNode): ManifestProduct {
  const variants = node.variants.edges.map((edge) => ({
    id: edge.node.id,
    title: edge.node.title,
    inventoryQty:
      typeof edge.node.inventoryQuantity === 'number' ? edge.node.inventoryQuantity : null,
    selectedOptions: edge.node.selectedOptions ?? [],
    image: edge.node.image?.url ?? null,
  }));

  const colorOption = node.options.find(
    (option) => typeof option.name === 'string' && option.name.toLowerCase() === 'colorway',
  );

  const firstVariant = variants[0];

  return {
    id: node.id,
    handle: node.handle,
    title: node.title,
    price: Number.parseFloat(node.priceRangeV2.minVariantPrice.amount),
    currency: node.priceRangeV2.minVariantPrice.currencyCode,
    image: node.featuredImage?.url ?? null,
    images: node.images.edges.map((edge) => ({
      url: edge.node.url,
      alt: edge.node.altText ?? '',
    })),
    colorways: colorOption ? colorOption.optionValues.map((value) => value.name) : [],
    variants,
    volume: node.volume?.value ?? '',
    editionTotal: parseIntegerOr(node.allocationTotal?.value, EDITION_01_TOTAL),
    editionIssued: parseIntegerOr(node.allocationIssued?.value, EDITION_01_DEFAULT_ISSUED),
    edition: node.edition?.value ?? EDITION_01_NUMBER,
    sku: node.skuRef?.value ?? '',
    variantId: firstVariant?.id ?? null,
    inventoryQty: firstVariant?.inventoryQty ?? null,
  };
}

function parseIntegerOr(raw: string | null | undefined, fallback: number): number {
  if (typeof raw !== 'string' || raw.length === 0) {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}
