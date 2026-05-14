// Writes the `manifest.allocation_issued` metafield for a product, bumping
// the displayed allocation number. GraphQL string lives INSIDE the function.

import { SHOPIFY_METAFIELD_KEYS, SHOPIFY_METAFIELD_NAMESPACE } from '@/lib/constants/shopify';
import {
  adminGraphql,
  type GraphqlResult,
  type GraphqlUserError,
} from '@/lib/shopify/admin-client';

export type SetAllocationMetafieldResponse = {
  metafieldsSet: {
    metafields: Array<{ id: string; key: string; value: string }> | null;
    userErrors: GraphqlUserError[];
  };
};

export async function setAllocationIssued(
  productId: string,
  nextValue: number,
): Promise<GraphqlResult<SetAllocationMetafieldResponse>> {
  const query = `#graphql
    mutation SetAllocationIssued($input: MetafieldsSetInput!) {
      metafieldsSet(metafields: [$input]) {
        metafields { id key value }
        userErrors { field message }
      }
    }
  `;

  return adminGraphql<SetAllocationMetafieldResponse>(query, {
    input: {
      ownerId: productId,
      namespace: SHOPIFY_METAFIELD_NAMESPACE,
      key: SHOPIFY_METAFIELD_KEYS.allocationIssued,
      type: 'number_integer',
      value: String(nextValue),
    },
  });
}
