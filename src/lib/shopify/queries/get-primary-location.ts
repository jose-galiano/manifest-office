// Returns the primary inventory location (first in the locations connection),
// used by inventoryAdjustQuantities. GraphQL string INSIDE the function.

import { adminGraphql } from '@/lib/shopify/admin-client';

import type { GraphqlResult } from '@/lib/shopify/admin-client';

export type PrimaryLocationResponse = {
  locations: {
    edges: Array<{ node: { id: string } }>;
  };
};

export async function fetchPrimaryLocation(): Promise<GraphqlResult<PrimaryLocationResponse>> {
  const query = `#graphql
    query PrimaryLocation {
      locations(first: 1) {
        edges { node { id } }
      }
    }
  `;

  return adminGraphql<PrimaryLocationResponse>(query);
}
