// Decrements (or arbitrarily adjusts) inventory at a specific location.
// Used by the reserve flow to drop "available" by 1 with a reservation
// reference document URI. GraphQL string INSIDE the function — Maelify §3.

import {
  adminGraphql,
  type GraphqlResult,
  type GraphqlUserError,
} from '@/lib/shopify/admin-client';

export type AdjustInventoryQuantityResponse = {
  inventoryAdjustQuantities: {
    inventoryAdjustmentGroup: {
      changes: Array<{ delta: number; name: string }> | null;
    } | null;
    userErrors: GraphqlUserError[];
  };
};

export type AdjustInventoryInput = {
  inventoryItemId: string;
  locationId: string;
  delta: number;
  reason: string;
  name: string;
  referenceDocumentUri: string;
};

export async function adjustInventoryQuantity(
  input: AdjustInventoryInput,
): Promise<GraphqlResult<AdjustInventoryQuantityResponse>> {
  const query = `#graphql
    mutation AdjustInventory($input: InventoryAdjustQuantitiesInput!) {
      inventoryAdjustQuantities(input: $input) {
        inventoryAdjustmentGroup { changes { delta name } }
        userErrors { field message }
      }
    }
  `;

  return adminGraphql<AdjustInventoryQuantityResponse>(query, {
    input: {
      reason: input.reason,
      name: input.name,
      referenceDocumentUri: input.referenceDocumentUri,
      changes: [
        {
          inventoryItemId: input.inventoryItemId,
          locationId: input.locationId,
          delta: input.delta,
        },
      ],
    },
  });
}
