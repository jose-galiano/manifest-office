'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useCart, useCartImageForHandle } from '@/hooks/use-cart';
import { CUSTOM_EVENTS, track } from '@/lib/analytics';
import { FLAT_SHIPPING_EUR, FREE_SHIP_THRESHOLD } from '@/lib/constants/commerce';

import type { CartItem } from '@/lib/state/cart';
import type { ReactElement } from 'react';

const EMAIL_STORAGE_KEY = 'mo_email';
const ORDER_NUMBER_KEY = 'mo_order_number';
const BOOK_CALL_HREF = 'https://www.maelify.com/pages/book';

function readSession(key: string): string {
  if (typeof window === 'undefined') return '';
  try {
    return window.sessionStorage.getItem(key) ?? '';
  } catch {
    return '';
  }
}

function readLocal(key: string): string {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(key) ?? '';
  } catch {
    return '';
  }
}

function formatEur(amount: number): string {
  return `€${Math.round(amount).toLocaleString('en-IE')}`;
}

function ReceiptRow({ item }: { readonly item: CartItem }): ReactElement {
  const liveImage = useCartImageForHandle(item.handle);
  const displayImage = item.imageUrl || liveImage;
  const total = item.price + (item.engraving?.fee ?? 0);
  return (
    <li className="flex items-start gap-3 py-3">
      <div className="relative h-[56px] w-[56px] shrink-0 overflow-hidden rounded-[6px] border border-[rgba(11,15,14,0.12)] bg-[rgba(11,15,14,0.04)]">
        {displayImage ? (
          <Image src={displayImage} alt={item.title} fill sizes="56px" className="object-cover" />
        ) : null}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-display text-[13px] font-medium leading-[1.25] text-[var(--color-ink)]">
          {item.title}
        </div>
        {item.engraving?.text ? (
          <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-lichen)]">
            Engraved · {item.engraving.text}
          </div>
        ) : null}
      </div>
      <div className="font-mono text-[13px] tabular-nums text-[var(--color-ink)]">
        {formatEur(total)}
      </div>
    </li>
  );
}

export default function ThankYouPage(): ReactElement {
  const { items, subtotalEur, clear } = useCart();
  const [orderNumber, setOrderNumber] = useState('MO-000000');
  const [email, setEmail] = useState('');
  const [snapshot, setSnapshot] = useState<readonly CartItem[]>([]);
  const [snapshotSubtotal, setSnapshotSubtotal] = useState<number>(0);

  useEffect(() => {
    const order = readSession(ORDER_NUMBER_KEY) || 'MO-000000';
    setOrderNumber(order);
    setEmail(readLocal(EMAIL_STORAGE_KEY));
    // Snapshot before clearing so the receipt survives the cart reset.
    setSnapshot(items);
    setSnapshotSubtotal(subtotalEur);
    track(CUSTOM_EVENTS.manifestComplete, {
      params: { order_number: order, source: 'checkout_thank_you' },
    });
    const handle = window.setTimeout(() => clear(), 200);
    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const freeShip = snapshotSubtotal >= FREE_SHIP_THRESHOLD;
  const shipping = freeShip ? 0 : FLAT_SHIPPING_EUR;
  const total = snapshotSubtotal + shipping;

  return (
    <div className="bg-[var(--color-paper)] text-[var(--color-ink)]">
      <header className="border-b border-[rgba(11,15,14,0.10)] bg-[var(--color-paper)]">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between px-5 py-5 sm:px-8">
          <Link
            href="/"
            className="font-display text-[18px] font-medium tracking-[-0.005em] text-[var(--color-ink)]"
          >
            Manifest Office
          </Link>
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--color-lichen)]">
            Order confirmation
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-[760px] px-5 py-12 sm:px-8 sm:py-16">
        <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-signal)]">
          ✓ CALL BOOKED
        </span>
        <h1 className="mt-3 font-display text-[36px] font-medium leading-[1.05] tracking-[-0.015em] sm:text-[48px]">
          Thanks for booking, {email.split('@')[0] || 'friend'}.
        </h1>
        <p className="mt-4 max-w-[52ch] text-[16px] leading-[1.6] text-[var(--color-ink)]/85">
          I&apos;ll reach out within one business day at{' '}
          <span className="font-mono text-[14px] text-[var(--color-ink)]">
            {email || 'your email'}
          </span>{' '}
          with a short questionnaire and a recommended 30-minute slot. If you&apos;d like to skip
          the wait, you can book directly with me from the link below.
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href={BOOK_CALL_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-[48px] items-center justify-center rounded-[4px] bg-[var(--color-ink)] px-6 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-paper)] transition-[background-color,letter-spacing] duration-[280ms] hover:bg-[var(--color-signal)] hover:tracking-[0.18em]"
          >
            Book a 30-min call now →
          </Link>
          <Link
            href="/"
            className="flex h-[48px] items-center justify-center rounded-[4px] border border-[var(--color-rule-strong)] px-6 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-ink)] transition-colors hover:border-[var(--color-ink)] hover:text-[var(--color-signal)]"
          >
            Keep exploring
          </Link>
        </div>

        <section
          aria-label="Order summary"
          className="mt-12 border border-[rgba(11,15,14,0.10)] bg-[rgba(11,15,14,0.04)] px-5 py-7 sm:px-7"
        >
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-[18px] font-medium tracking-[-0.005em]">
              Order summary
            </h2>
            <span className="font-mono text-[12px] tabular-nums text-[var(--color-lichen)]">
              {orderNumber}
            </span>
          </div>

          {snapshot.length > 0 ? (
            <>
              <ul className="mt-4 divide-y divide-[rgba(11,15,14,0.10)] border-t border-b border-[rgba(11,15,14,0.10)]">
                {snapshot.map((item) => (
                  <ReceiptRow
                    key={`${item.handle}::${item.engraving?.text ?? ''}::${item.issuedAs ?? 'x'}`}
                    item={item}
                  />
                ))}
              </ul>

              <dl className="mt-5 flex flex-col gap-2 text-[14px]">
                <div className="flex items-baseline justify-between">
                  <dt className="text-[var(--color-ink)]/85">Subtotal</dt>
                  <dd className="font-mono tabular-nums">{formatEur(snapshotSubtotal)}</dd>
                </div>
                <div className="flex items-baseline justify-between">
                  <dt className="text-[var(--color-ink)]/85">Shipping</dt>
                  <dd className="font-mono tabular-nums">
                    {freeShip ? 'Included' : formatEur(FLAT_SHIPPING_EUR)}
                  </dd>
                </div>
              </dl>

              <div className="mt-5 flex items-baseline justify-between border-t border-[rgba(11,15,14,0.10)] pt-5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--color-lichen)]">
                  Total · EUR
                </span>
                <span className="font-display text-[22px] font-medium tabular-nums tracking-[-0.01em]">
                  {formatEur(total)}
                </span>
              </div>
            </>
          ) : (
            <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--color-lichen)]">
              No items in the manifest. The booking still went through.
            </p>
          )}
        </section>

        <p className="mt-12 max-w-[58ch] text-[14px] leading-[1.6] text-[var(--color-ink)]/85">
          The whole storefront you just walked through is a portfolio piece by{' '}
          <strong>Jose Galiano</strong>, a Shopify Plus &amp; agentic-commerce architect based in
          Valencia. Public repo, MIT licensed:{' '}
          <a
            href="https://github.com/jose-galiano/manifest-office"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-[var(--color-rule-strong)] underline-offset-[3px] transition-colors hover:text-[var(--color-signal)] hover:decoration-[var(--color-signal)]"
          >
            github.com/jose-galiano/manifest-office
          </a>
          .
        </p>
      </div>
    </div>
  );
}
