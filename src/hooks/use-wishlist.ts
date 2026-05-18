'use client';

import { useWishlistStore } from '@/lib/state/wishlist';

import type { WishlistItem } from '@/lib/state/wishlist';

export type UseWishlistResult = {
  readonly items: readonly WishlistItem[];
  readonly count: number;
  readonly isDrawerOpen: boolean;
  readonly sharedHandles: readonly string[] | null;
  add: (item: Omit<WishlistItem, 'addedAt'>) => void;
  remove: (handle: string) => void;
  toggle: (item: Omit<WishlistItem, 'addedAt'>) => boolean;
  has: (handle: string) => boolean;
  clear: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  setSharedHandles: (handles: readonly string[] | null) => void;
};

export function useWishlist(): UseWishlistResult {
  const items = useWishlistStore((state) => state.items);
  const isDrawerOpen = useWishlistStore((state) => state.isDrawerOpen);
  const sharedHandles = useWishlistStore((state) => state.sharedHandles);
  const add = useWishlistStore((state) => state.add);
  const remove = useWishlistStore((state) => state.remove);
  const toggle = useWishlistStore((state) => state.toggle);
  const has = useWishlistStore((state) => state.has);
  const clear = useWishlistStore((state) => state.clear);
  const openDrawer = useWishlistStore((state) => state.openDrawer);
  const closeDrawer = useWishlistStore((state) => state.closeDrawer);
  const toggleDrawer = useWishlistStore((state) => state.toggleDrawer);
  const setSharedHandles = useWishlistStore((state) => state.setSharedHandles);

  return {
    items,
    count: items.length,
    isDrawerOpen,
    sharedHandles,
    add,
    remove,
    toggle,
    has,
    clear,
    openDrawer,
    closeDrawer,
    toggleDrawer,
    setSharedHandles,
  };
}

export function useWishlistHas(handle: string): boolean {
  return useWishlistStore((state) => state.items.some((entry) => entry.handle === handle));
}
