/**
 * `useCart()` — read-write hook into the global cart store.
 *
 * The store itself lives at `lib/state/cart.ts`. This hook is the surface
 * that components use; it exists so that components never import directly
 * from `lib/state/` (Maelify §1 layer separation: components → hooks →
 * state).
 */

'use client';

import { useCartStore } from '@/lib/state/cart';

import type { CartItem, CartItemEngraving } from '@/lib/state/cart';

export type CartEngravingLineRef = {
  readonly handle: string;
  readonly issuedAs?: number;
  readonly previousText?: string;
};

export type UseCartResult = {
  readonly items: readonly CartItem[];
  readonly count: number;
  readonly subtotalEur: number;
  readonly isDrawerOpen: boolean;
  add: (item: CartItem) => void;
  remove: (handle: string) => void;
  removeLine: (handle: string, engravingText: string | undefined) => void;
  updateEngraving: (line: CartEngravingLineRef, engraving: CartItemEngraving | null) => void;
  clear: () => void;
  setImageForHandle: (handle: string, imageUrl: string) => void;
  resolveImage: (handle: string) => string | null;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
};

/**
 * Subscribe to the live image URL for a single cart line. Each `CartItemRow`
 * reads from this so it re-renders the moment the image-by-handle map is
 * hydrated (drawer mount, cart-page mount) without forcing every other
 * subscriber to re-render too. Returns `null` until hydration arrives.
 */
export function useCartImageForHandle(handle: string): string | null {
  return useCartStore((state) => state.imagesByHandle[handle] ?? null);
}

/**
 * Subscribes to the cart store. The `count` and `subtotalEur` are derived
 * inside the hook (not stored) so they always reflect the latest `items`.
 */
export function useCart(): UseCartResult {
  const items = useCartStore((state) => state.items);
  const isDrawerOpen = useCartStore((state) => state.isDrawerOpen);
  // We don't subscribe to `imagesByHandle` directly — that would re-render
  // every consumer on every image-write. `resolveImage` reads from store
  // state lazily via `getState()` at call time.
  const add = useCartStore((state) => state.add);
  const remove = useCartStore((state) => state.remove);
  const removeLine = useCartStore((state) => state.removeLine);
  const updateEngraving = useCartStore((state) => state.updateEngraving);
  const clear = useCartStore((state) => state.clear);
  const setImageForHandle = useCartStore((state) => state.setImageForHandle);
  const resolveImage = useCartStore((state) => state.resolveImage);
  const openDrawer = useCartStore((state) => state.openDrawer);
  const closeDrawer = useCartStore((state) => state.closeDrawer);
  const toggleDrawer = useCartStore((state) => state.toggleDrawer);

  const count = items.length;
  const subtotalEur = items.reduce((sum, item) => sum + item.price + (item.engraving?.fee ?? 0), 0);

  return {
    items,
    count,
    subtotalEur,
    isDrawerOpen,
    add,
    remove,
    removeLine,
    updateEngraving,
    clear,
    setImageForHandle,
    resolveImage,
    openDrawer,
    closeDrawer,
    toggleDrawer,
  };
}
