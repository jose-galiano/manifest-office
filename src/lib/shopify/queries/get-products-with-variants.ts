// Fetches the Edition 01 catalogue by handle alias, batched in one request.
// GraphQL string is constructed INSIDE the function — Maelify §3.

import { adminGraphql } from '@/lib/shopify/admin-client';

import type { GraphqlResult } from '@/lib/shopify/admin-client';

type MetafieldNode = { id?: string; value: string | null } | null;

export type ShopifyProductNode = {
  id: string;
  handle: string;
  title: string;
  totalInventory: number | null;
  priceRangeV2: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  featuredImage: { url: string; altText: string | null } | null;
  images: {
    edges: Array<{ node: { url: string; altText: string | null } }>;
  };
  options: Array<{
    id: string;
    name: string;
    optionValues: Array<{ id: string; name: string }>;
  }>;
  variants: {
    edges: Array<{
      node: {
        id: string;
        title: string;
        inventoryQuantity: number | null;
        selectedOptions: Array<{ name: string; value: string }>;
        image: { url: string; altText: string | null } | null;
      };
    }>;
  };
  volume: MetafieldNode;
  allocationTotal: MetafieldNode;
  allocationIssued: MetafieldNode;
  edition: MetafieldNode;
  skuRef: MetafieldNode;
};

export type ProductsByHandleResponse = Record<string, ShopifyProductNode | null>;

export async function fetchProductsByHandle(
  handles: readonly string[],
): Promise<GraphqlResult<ProductsByHandleResponse>> {
  const query = `#graphql
    query GetProducts {
      ${handles
        .map(
          (handle, index) => `p${index}: productByHandle(handle: "${handle}") {
        id handle title totalInventory
        priceRangeV2 { minVariantPrice { amount currencyCode } }
        featuredImage { url altText }
        images(first: 30) { edges { node { url altText } } }
        options { id name optionValues { id name } }
        variants(first: 10) {
          edges { node {
            id title inventoryQuantity
            selectedOptions { name value }
            image { url altText }
          } }
        }
        volume: metafield(namespace: "manifest", key: "volume") { value }
        allocationTotal: metafield(namespace: "manifest", key: "allocation_total") { value }
        allocationIssued: metafield(namespace: "manifest", key: "allocation_issued") { value }
        edition: metafield(namespace: "manifest", key: "edition") { value }
        skuRef: metafield(namespace: "manifest", key: "sku_ref") { value }
      }`,
        )
        .join('\n')}
    }
  `;

  return adminGraphql<ProductsByHandleResponse>(query);
}
