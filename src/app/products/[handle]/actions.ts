/**
 * PDP Server Actions.
 *
 * Thin Maelify §1 wiring layer: routes a `<PdpBuybox />` reserve click to
 * the existing `reserveProduct()` service. No GraphQL, no business logic —
 * the service owns sanitisation (engraving regex / max length / fee
 * re-derivation) and Shopify mutations.
 *
 * The action runs on the server (the `'use server'` directive at the top
 * of the file is what Next 15 looks for). Returning a discriminated union
 * keeps the client code branch-explicit instead of throwing for sold-out.
 */

'use server';

import { reserveProduct } from '@/lib/services/reserve-product';
import { toShopifyHandle } from '@/lib/shopify/handle';

import type { ReserveResponse } from '@/lib/types/reserve';

export type ReserveActionResult =
  | { readonly ok: true; readonly data: ReserveResponse }
  | { readonly ok: false; readonly status: number; readonly error: string };

export async function reserveProductAction(
  storefrontHandle: string,
  engraving: string | null,
): Promise<ReserveActionResult> {
  const shopifyHandle = toShopifyHandle(storefrontHandle);
  const result = await reserveProduct({ handle: shopifyHandle, engraving });
  if (!result.ok) {
    return { ok: false, status: result.status, error: result.error };
  }
  return { ok: true, data: result.data };
}
