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
 *
 * Drawer open/close state:
 *  - Held in the same store for ergonomics (any component can open the
 *    drawer via `useCart().openDrawer()`), but DELIBERATELY NOT persisted —
 *    `partialize` only emits `items`. Re-opening the drawer after a page
 *    navigation would be confusing UX.
 *  - Wave 3A (Buybox) should call `openDrawer()` immediately after a
 *    successful reserve so the user sees their reservation.
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
  readonly isDrawerOpen: boolean;
  /**
   * Live image-by-handle map populated when a consumer fetches the product
   * feed (drawer upsells, cart-page hydration). `CartItemRow` reads from
   * this as a fallback when the persisted `item.imageUrl` is missing/stale
   * — items added in earlier sessions can otherwise lose their thumbnail.
   * Not persisted: rebuilt from `/api/products` on each load.
   */
  readonly imagesByHandle: Readonly<Record<string, string>>;
};

export type CartActions = {
  add: (item: CartItem) => void;
  remove: (handle: string) => void;
  removeLine: (handle: string, engravingText: string | undefined) => void;
  /**
   * Update (or clear) the engraving on a specific line. Identifies the line
   * by `issuedAs` (the reservation ID) when present; falls back to matching
   * the legacy handle + previous-text composite key.
   */
  updateEngraving: (
    line: { readonly handle: string; readonly issuedAs?: number; readonly previousText?: string },
    engraving: CartItemEngraving | null,
  ) => void;
  clear: () => void;
  setImageForHandle: (handle: string, imageUrl: string) => void;
  resolveImage: (handle: string) => string | null;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
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
    (set, get) => ({
      items: [],
      isDrawerOpen: false,
      imagesByHandle: {},
      add: (item) =>
        set((state) => {
          const filtered = state.items.filter((existing) => !sameLine(existing, item));
          return { items: [...filtered, item] };
        }),
      remove: (handle) =>
        set((state) => ({ items: state.items.filter((item) => item.handle !== handle) })),
      removeLine: (handle, engravingText) =>
        set((state) => ({
          items: state.items.filter(
            (item) =>
              !(item.handle === handle && (item.engraving?.text ?? '') === (engravingText ?? '')),
          ),
        })),
      updateEngraving: (line, engraving) =>
        set((state) => {
          const next = state.items.map((entry) => {
            const matchesIssue =
              typeof line.issuedAs === 'number' && entry.issuedAs === line.issuedAs;
            const matchesLegacy =
              typeof line.issuedAs !== 'number' &&
              entry.handle === line.handle &&
              (entry.engraving?.text ?? '') === (line.previousText ?? '');
            if (!matchesIssue && !matchesLegacy) return entry;
            return { ...entry, engraving: engraving ?? undefined };
          });
          return { items: next };
        }),
      clear: () => set({ items: [] }),
      setImageForHandle: (handle, imageUrl) =>
        set((state) => {
          if (!handle || !imageUrl || state.imagesByHandle[handle] === imageUrl) return state;
          return { imagesByHandle: { ...state.imagesByHandle, [handle]: imageUrl } };
        }),
      resolveImage: (handle) => get().imagesByHandle[handle] ?? null,
      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),
      toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),
    }),
    {
      name: MO_CART_STORAGE_KEY,
      storage: createJSONStorage(() => getSessionStorage() ?? noopStorage),
      // Only the items array persists — actions and drawer-open state are
      // recreated on every load (re-opening the drawer after a nav would be
      // confusing UX).
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
