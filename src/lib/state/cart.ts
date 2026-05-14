/**
 * Cart store — Zustand + sessionStorage persistence.
 *
 * Legacy `deploy/pdp.html` kept the cart inside a per-page IIFE closure and
 * bridged across pages via `window.MO.*` plus `sessionStorage.mo_cart`. In
 * the Next App Router rewrite the cart must be a first-class global store so
 * the header `CartBadge` reacts on every page and the drawer can be hoisted
 * into `app/layout.tsx`.
 *
 * Persistence:
 *  - `sessionStorage` only — matches legacy lifetime (cart clears on tab
 *    close).
 *  - `MO_CART_STORAGE_KEY` retains the legacy storage key (`mo_cart`) so
 *    visitors with an open tab during the cut-over keep their cart.
 *  - SSR-safe: the persist middleware skips reading from storage on the
 *    server; the first client render hydrates.
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** Engraving sub-line attached to a cart item. Personalisation is per-item. */
export type CartItemEngraving = {
  readonly text: string;
  readonly fee: number;
};

export type CartItem = {
  /** Storefront handle (no `manifest-` prefix). */
  readonly handle: string;
  readonly title: string;
  /** Unit price in EUR (excluding the engraving fee). */
  readonly price: number;
  readonly imageUrl: string;
  /** Issue number stamped by `/api/reserve`, if known. */
  readonly issuedAs?: number;
  readonly engraving?: CartItemEngraving;
};

export type CartState = {
  readonly items: readonly CartItem[];
};

export type CartActions = {
  add: (item: CartItem) => void;
  remove: (handle: string) => void;
  clear: () => void;
};

export type CartStore = CartState & CartActions;

export const MO_CART_STORAGE_KEY = 'mo_cart';

/**
 * Two cart entries are considered the same line when both their handle and
 * their engraving text match. Engraving-on and engraving-off versions of the
 * same SKU stay distinct rows (per legacy `pdp.html` cart drawer behaviour).
 */
function sameLine(left: CartItem, right: CartItem): boolean {
  return (
    left.handle === right.handle && (left.engraving?.text ?? '') === (right.engraving?.text ?? '')
  );
}

/** Lazy sessionStorage adapter — `undefined` on the server so SSR stays clean. */
function getSessionStorage(): Storage | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    return window.sessionStorage;
  } catch {
    return undefined;
  }
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      add: (item) =>
        set((state) => {
          // De-duplicate: if the same line already exists, we keep one entry.
          // (Legacy behaviour replaces the prior reservation for the same
          // handle+engraving, since each reservation produces a fresh issue
          // number.)
          const filtered = state.items.filter((existing) => !sameLine(existing, item));
          return { items: [...filtered, item] };
        }),
      remove: (handle) =>
        set((state) => ({ items: state.items.filter((item) => item.handle !== handle) })),
      clear: () => set({ items: [] }),
    }),
    {
      name: MO_CART_STORAGE_KEY,
      storage: createJSONStorage(() => getSessionStorage() ?? noopStorage),
      // Only the items array persists — actions are recreated on every load.
      partialize: (state) => ({ items: state.items }),
      version: 1,
    },
  ),
);

/**
 * Fallback when sessionStorage is unavailable (SSR, prerender, blocked-by-
 * privacy mode). Behaves as an in-memory no-op so Zustand never crashes.
 */
const noopStorage: Storage = {
  length: 0,
  clear: () => undefined,
  getItem: () => null,
  key: () => null,
  removeItem: () => undefined,
  setItem: () => undefined,
};
