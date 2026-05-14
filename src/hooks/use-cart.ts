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

import type { CartItem } from '@/lib/state/cart';

export type UseCartResult = {
  readonly items: readonly CartItem[];
  readonly count: number;
  readonly subtotalEur: number;
  add: (item: CartItem) => void;
  remove: (handle: string) => void;
  clear: () => void;
};

/**
 * Subscribes to the cart store. The `count` and `subtotalEur` are derived
 * inside the hook (not stored) so they always reflect the latest `items`.
 */
export function useCart(): UseCartResult {
  const items = useCartStore((state) => state.items);
  const add = useCartStore((state) => state.add);
  const remove = useCartStore((state) => state.remove);
  const clear = useCartStore((state) => state.clear);

  const count = items.length;
  const subtotalEur = items.reduce((sum, item) => sum + item.price + (item.engraving?.fee ?? 0), 0);

  return { items, count, subtotalEur, add, remove, clear };
}
