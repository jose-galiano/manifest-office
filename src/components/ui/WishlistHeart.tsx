'use client';

import { useCallback, useState } from 'react';

import { useWishlist } from '@/hooks/use-wishlist';
import { CUSTOM_EVENTS, track } from '@/lib/analytics';

import type { MouseEvent, ReactElement } from 'react';

type WishlistHeartProps = {
  readonly handle: string;
  readonly title: string;
  readonly priceEur: number;
  readonly imageUrl: string;
};

export function WishlistHeart({
  handle,
  title,
  priceEur,
  imageUrl,
}: WishlistHeartProps): ReactElement {
  const { toggle, has, openDrawer } = useWishlist();
  const wished = has(handle);
  const [pulse, setPulse] = useState<boolean>(false);

  const onClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>): void => {
      event.preventDefault();
      event.stopPropagation();

      const wasAdded = toggle({ handle, title, priceEur, imageUrl });

      track(wasAdded ? CUSTOM_EVENTS.wishlistAdd : CUSTOM_EVENTS.wishlistRemove, {
        params: { handle, title, price: priceEur, source: 'product_card' },
        fanout: wasAdded ? { klaviyo: true } : undefined,
      });

      if (wasAdded) {
        if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
          navigator.vibrate(12);
        }
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('mo:wishlist-added'));
        }
        setPulse(false);
        window.requestAnimationFrame(() => setPulse(true));
        window.setTimeout(() => setPulse(false), 560);
        window.setTimeout(() => openDrawer(), 280);
      }
    },
    [handle, imageUrl, openDrawer, priceEur, title, toggle],
  );

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={wished ? `Remove ${title} from wishlist` : `Save ${title} to wishlist`}
      aria-pressed={wished}
      data-pulse={pulse ? 'on' : 'off'}
      className={`mo-wishlist-heart group/heart absolute bottom-3 left-3 z-10 inline-flex items-center justify-center rounded-full border border-[rgba(11,15,14,0.12)] bg-[#F2EFE8] p-2.5 shadow-[0_2px_10px_rgba(11,15,14,0.12)] transition-[transform,background,border-color] duration-200 hover:bg-white active:scale-[0.94] ${
        wished ? 'is-on !border-transparent !bg-[#D24A1F]' : ''
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        aria-hidden="true"
        fill={wished ? '#F2EFE8' : 'none'}
        stroke={wished ? '#F2EFE8' : '#0B0F0E'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      <style>{`
        .mo-wishlist-heart[data-pulse='on'] svg {
          animation: mo-heart-pop 540ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        @keyframes mo-heart-pop {
          0%   { transform: scale(1); }
          30%  { transform: scale(1.45); }
          60%  { transform: scale(0.92); }
          100% { transform: scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .mo-wishlist-heart[data-pulse='on'] svg { animation: none; }
        }
      `}</style>
    </button>
  );
}
