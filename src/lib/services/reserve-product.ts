// Orchestrates a reservation:
//   1. Fetch the product, its first variant, the inventory item id, and the
//      current allocation_issued metafield.
//   2. If allocation is full → 200 with sold_out=true (preserve legacy shape).
//   3. Bump the allocation_issued metafield by 1.
//   4. Decrement the variant's inventory at the primary location by 1.
//   5. Return the issue number, label, remaining count, and the sanitised
//      engraving / re-derived fee.
//
// The engraving fee is re-derived from a server-side constant; the client
// value is informational. Anti-tamper per migration-spec §8.5.

import { ENGRAVING_ALLOWED_REGEX, ENGRAVING_FEE, ENGRAVING_MAX } from '@/lib/constants/commerce';
import { adjustInventoryQuantity } from '@/lib/shopify/mutations/adjust-inventory-quantity';
import { setAllocationIssued } from '@/lib/shopify/mutations/set-allocation-metafield';
import { fetchPrimaryLocation } from '@/lib/shopify/queries/get-primary-location';
import { fetchReserveProductState } from '@/lib/shopify/queries/reserve-product-state';

import type {
  ReserveResponse,
  ReserveSoldOutResponse,
  ReserveSuccessResponse,
} from '@/lib/types/reserve';

export type ReserveServiceSuccess = { ok: true; data: ReserveResponse };
export type ReserveServiceFailure = {
  ok: false;
  status: number;
  error: 'product_not_found' | 'metafield_update_failed' | 'reserve_failed';
  detail?: unknown;
};
export type ReserveServiceResult = ReserveServiceSuccess | ReserveServiceFailure;

export type ReserveInput = {
  handle: string;
  engraving: string | null;
};

export async function reserveProduct(input: ReserveInput): Promise<ReserveServiceResult> {
  try {
    const safeEngraving = sanitiseEngraving(input.engraving);
    const safeFee = safeEngraving ? ENGRAVING_FEE : 0;

    // 1. Fetch current state.
    const stateResult = await fetchReserveProductState(input.handle);
    if (!stateResult.ok || !stateResult.data.productByHandle) {
      return {
        ok: false,
        status: 404,
        error: 'product_not_found',
        detail: stateResult.ok ? null : stateResult.errors,
      };
    }
    const product = stateResult.data.productByHandle;

    const currentIssued = parseIntegerOr(product.metafield?.value ?? null, 0);
    const totalAllocation = parseIntegerOr(product.metafieldTotal?.value ?? null, 1200);

    if (currentIssued >= totalAllocation) {
      const soldOut: ReserveSoldOutResponse = {
        issued: currentIssued,
        total: totalAllocation,
        sold_out: true,
        message: `Edition 01 closed at ${totalAllocation} systems.`,
      };
      return { ok: true, data: soldOut };
    }

    const nextIssued = currentIssued + 1;

    // 2. Set the metafield.
    const metafieldResult = await setAllocationIssued(product.id, nextIssued);
    if (!metafieldResult.ok) {
      return {
        ok: false,
        status: 500,
        error: 'metafield_update_failed',
        detail: metafieldResult.errors,
      };
    }
    const userErrors = metafieldResult.data.metafieldsSet.userErrors;
    if (userErrors.length > 0) {
      return { ok: false, status: 500, error: 'metafield_update_failed', detail: userErrors };
    }

    // 3. Decrement inventory at the primary location (best effort).
    const firstVariant = product.variants.edges[0]?.node;
    const inventoryQty =
      typeof firstVariant?.inventoryQuantity === 'number' ? firstVariant.inventoryQuantity : null;
    const inventoryAfter = await tryDecrementInventory({
      inventoryItemId: firstVariant?.inventoryItem?.id ?? null,
      currentQuantity: inventoryQty,
      issueNumber: nextIssued,
    });

    const success: ReserveSuccessResponse = {
      handle: input.handle,
      title: product.title,
      issue: nextIssued,
      total: totalAllocation,
      issued_label: String(nextIssued).padStart(5, '0'),
      remaining: totalAllocation - nextIssued,
      inventory_after: inventoryAfter,
      engraving: safeEngraving,
      engraving_fee: safeFee,
      timestamp: new Date().toISOString(),
    };
    return { ok: true, data: success };
  } catch (caught) {
    return {
      ok: false,
      status: 500,
      error: 'reserve_failed',
      detail: caught instanceof Error ? caught.message : 'unknown_error',
    };
  }
}

type DecrementInput = {
  inventoryItemId: string | null;
  currentQuantity: number | null;
  issueNumber: number;
};

async function tryDecrementInventory(input: DecrementInput): Promise<number | null> {
  if (!input.inventoryItemId) {
    return input.currentQuantity;
  }
  const locationResult = await fetchPrimaryLocation();
  if (!locationResult.ok) {
    return input.currentQuantity;
  }
  const locationId = locationResult.data.locations.edges[0]?.node.id ?? null;
  if (!locationId) {
    return input.currentQuantity;
  }

  const adjustResult = await adjustInventoryQuantity({
    inventoryItemId: input.inventoryItemId,
    locationId,
    delta: -1,
    reason: 'reservation',
    name: 'available',
    referenceDocumentUri: `logistics://manifest-office/issue/${input.issueNumber}`,
  });

  if (!adjustResult.ok) {
    return input.currentQuantity;
  }
  const adjustErrors = adjustResult.data.inventoryAdjustQuantities.userErrors;
  if (adjustErrors.length > 0 || typeof input.currentQuantity !== 'number') {
    return input.currentQuantity;
  }
  return input.currentQuantity - 1;
}

function sanitiseEngraving(raw: string | null | undefined): string | null {
  if (typeof raw !== 'string' || raw.length === 0) {
    return null;
  }
  const cleaned = raw.toUpperCase().replace(ENGRAVING_ALLOWED_REGEX, '').slice(0, ENGRAVING_MAX);
  return cleaned.length > 0 ? cleaned : null;
}

function parseIntegerOr(raw: string | null, fallback: number): number {
  if (typeof raw !== 'string' || raw.length === 0) {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}
