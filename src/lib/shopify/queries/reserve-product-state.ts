// Reads the product, its first variant's inventory item, and the current
// allocation_issued / allocation_total metafield values — everything the
// reserve flow needs before writing.
//
// GraphQL string lives INSIDE the function. Maelify §3.

import { adminGraphql } from '@/lib/shopify/admin-client';

import type { GraphqlResult } from '@/lib/shopify/admin-client';

export type ReserveProductStateResponse = {
  productByHandle: {
    id: string;
    title: string;
    variants: {
      edges: Array<{
        node: {
          id: string;
          inventoryQuantity: number | null;
          inventoryItem: { id: string } | null;
        };
      }>;
    };
    metafield: { id: string; value: string | null } | null;
    metafieldTotal: { value: string | null } | null;
  } | null;
};

export async function fetchReserveProductState(
  handle: string,
): Promise<GraphqlResult<ReserveProductStateResponse>> {
  // Embedded string interpolation is safe here — `handle` comes from a
  // server-side parsed-and-validated request body. We still avoid the value
  // touching the GraphQL parser as a variable would (the legacy code used
  // string interpolation too; preserving behaviour).
  const safeHandle = handle.replace(/"/g, '');
  const query = `#graphql
    query ReserveProductState {
      productByHandle(handle: "${safeHandle}") {
        id title
        variants(first: 1) {
          edges {
            node {
              id
              inventoryQuantity
              inventoryItem { id }
            }
          }
        }
        metafield(namespace: "manifest", key: "allocation_issued") { id value }
        metafieldTotal: metafield(namespace: "manifest", key: "allocation_total") { value }
      }
    }
  `;

  return adminGraphql<ReserveProductStateResponse>(query);
}
