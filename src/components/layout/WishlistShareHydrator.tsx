'use client';

import { useEffect } from 'react';

import { useWishlist } from '@/hooks/use-wishlist';
import { CUSTOM_EVENTS, track } from '@/lib/analytics';

import type { ReactElement } from 'react';

const SHARE_PARAM = 'w';
const MAX_HANDLES = 24;
const HANDLE_PATTERN = /^[a-z0-9-]{1,80}$/;

export function WishlistShareHydrator(): ReactElement | null {
  const { setSharedHandles, openDrawer } = useWishlist();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const raw = params.get(SHARE_PARAM);
    if (!raw) return;

    const handles = raw
      .split(',')
      .map((entry) => entry.trim().toLowerCase())
      .filter((entry) => HANDLE_PATTERN.test(entry))
      .slice(0, MAX_HANDLES);

    if (handles.length === 0) return;

    setSharedHandles(handles);
    openDrawer();
    track(CUSTOM_EVENTS.wishlistSharedView, { params: { count: handles.length } });

    params.delete(SHARE_PARAM);
    const nextSearch = params.toString();
    const nextUrl =
      window.location.pathname + (nextSearch ? `?${nextSearch}` : '') + window.location.hash;
    window.history.replaceState(window.history.state, '', nextUrl);
  }, [openDrawer, setSharedHandles]);

  return null;
}
