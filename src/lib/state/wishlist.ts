/**
 * Wishlist store — Zustand + localStorage persistence.
 *
 * Mirrors the shape of `useCartStore` but the storage layer is localStorage
 * (not sessionStorage) so wishes survive across tabs and sessions. A
 * cross-tab `storage` listener wakes the store when another tab mutates the
 * list, so the header badge + drawer stay coherent.
 *
 * Drawer-only UX: there is no `/wishlist` page. The drawer takes a shared-
 * preview mode (`sharedHandles`) which it uses to render a non-destructive
 * "Shared with you" view when the URL contains `?w=...`.
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type WishlistItem = {
  readonly handle: string;
  readonly title: string;
  readonly priceEur: number;
  readonly imageUrl: string;
  readonly addedAt: number;
};

export type WishlistState = {
  readonly items: readonly WishlistItem[];
  readonly isDrawerOpen: boolean;
  readonly sharedHandles: readonly string[] | null;
};

export type WishlistActions = {
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

export type WishlistStore = WishlistState & WishlistActions;

export const MO_WISHLIST_STORAGE_KEY = 'mo_wishlist';

function getLocalStorage(): Storage | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

const noopStorage: Storage = {
  length: 0,
  clear: () => undefined,
  getItem: () => null,
  key: () => null,
  removeItem: () => undefined,
  setItem: () => undefined,
};

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      isDrawerOpen: false,
      sharedHandles: null,
      add: (input) =>
        set((state) => {
          if (state.items.some((existing) => existing.handle === input.handle)) return state;
          const next: WishlistItem = { ...input, addedAt: Date.now() };
          return { items: [next, ...state.items] };
        }),
      remove: (handle) =>
        set((state) => ({ items: state.items.filter((entry) => entry.handle !== handle) })),
      toggle: (input) => {
        const existing = get().items.find((entry) => entry.handle === input.handle);
        if (existing) {
          set((state) => ({ items: state.items.filter((entry) => entry.handle !== input.handle) }));
          return false;
        }
        const next: WishlistItem = { ...input, addedAt: Date.now() };
        set((state) => ({ items: [next, ...state.items] }));
        return true;
      },
      has: (handle) => get().items.some((entry) => entry.handle === handle),
      clear: () => set({ items: [] }),
      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false, sharedHandles: null }),
      toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),
      setSharedHandles: (handles) => set({ sharedHandles: handles }),
    }),
    {
      name: MO_WISHLIST_STORAGE_KEY,
      storage: createJSONStorage(() => getLocalStorage() ?? noopStorage),
      partialize: (state) => ({ items: state.items }),
      version: 1,
    },
  ),
);

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== MO_WISHLIST_STORAGE_KEY || !event.newValue) return;
    try {
      const parsed = JSON.parse(event.newValue) as { state?: { items?: readonly WishlistItem[] } };
      const items = parsed.state?.items;
      if (Array.isArray(items)) useWishlistStore.setState({ items });
    } catch {
      // ignore malformed cross-tab payloads
    }
  });
}
