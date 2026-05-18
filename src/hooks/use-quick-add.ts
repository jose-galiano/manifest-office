'use client';

import { useCallback, useState, useTransition } from 'react';

import { reserveProductAction } from '@/app/products/[handle]/actions';
import { useCart } from '@/hooks/use-cart';
import { CUSTOM_EVENTS, ECOMMERCE_EVENTS, track } from '@/lib/analytics';

export type QuickAddInput = {
  readonly storefrontHandle: string;
  readonly title: string;
  readonly priceEur: number;
};

export type QuickAddVariant = {
  readonly imageUrl: string;
  readonly colorwayName: string;
};

export type UseQuickAddResult = {
  readonly pending: boolean;
  readonly success: boolean;
  add: (variant: QuickAddVariant) => void;
};

const SUCCESS_HOLD_MS = 620;

export function useQuickAdd(input: QuickAddInput, onComplete?: () => void): UseQuickAddResult {
  const [pending, startTransition] = useTransition();
  const [success, setSuccess] = useState<boolean>(false);
  const { add: addCartItem, openDrawer } = useCart();

  const add = useCallback(
    (variant: QuickAddVariant): void => {
      track(CUSTOM_EVENTS.reserveClick, {
        params: {
          handle: input.storefrontHandle,
          title: input.title,
          price: input.priceEur,
          colorway: variant.colorwayName,
          source: 'product_card_quick_add',
          has_engraving: false,
        },
      });

      startTransition(async () => {
        const result = await reserveProductAction(input.storefrontHandle, null);
        if (!result.ok) return;
        if ('sold_out' in result.data) return;

        const reservation = result.data;
        addCartItem({
          handle: input.storefrontHandle,
          title: input.title,
          price: input.priceEur,
          imageUrl: variant.imageUrl,
          issuedAs: reservation.issue,
        });

        track(ECOMMERCE_EVENTS.addToCart, {
          ecommerce: {
            currency: 'EUR',
            value: input.priceEur,
            items: [
              {
                item_id: input.storefrontHandle,
                item_name: input.title,
                item_brand: 'Manifest Office',
                item_variant: variant.colorwayName,
                price: input.priceEur,
                quantity: 1,
                currency: 'EUR',
              },
            ],
          },
          params: { issue: reservation.issue, source: 'product_card_quick_add' },
          fanout: { klaviyo: true },
        });

        if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
          navigator.vibrate(15);
        }
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('mo:cart-added'));
        }

        setSuccess(true);
        window.setTimeout(() => {
          setSuccess(false);
          onComplete?.();
          openDrawer();
        }, SUCCESS_HOLD_MS);
      });
    },
    [addCartItem, input.priceEur, input.storefrontHandle, input.title, onComplete, openDrawer],
  );

  return { pending, success, add };
}
