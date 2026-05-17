/**
 * `/checkout` — a faux Shopify-Plus-style checkout that completes the
 * portfolio funnel.
 *
 * Visually mirrors the Shopify Plus checkout layout (split form left,
 * order summary right, secure-lock header, express row, contact + delivery
 * fields, "Pay now" CTA). The narrative pivots in three places:
 *  - A subtle paper card at the top of the form column explains the trick:
 *    the form is a lead capture, the Pay button books a call.
 *  - The express row replaces Apple Pay / Shop Pay buttons with
 *    "Express: Book a quick call" affordances.
 *  - The Pay button is labelled "Book the call" and submits the lead.
 *
 * Submission posts a portfolio_checkout_submitted event to /api/track and
 * navigates to /checkout/thank-you with a synthetic order number. No card
 * data is collected. The visible fields exist to sell the illusion; the
 * only field that's read on submit is email.
 *
 * Order summary pulls real cart data from the Zustand store via useCart.
 * If the visitor lands here with an empty cart we redirect them back
 * to /collections/edition-01 — same UX a real checkout would enforce.
 */

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';

import { useCart, useCartImageForHandle } from '@/hooks/use-cart';
import { ECOMMERCE_EVENTS, track } from '@/lib/analytics';
import { FLAT_SHIPPING_EUR, FREE_SHIP_THRESHOLD } from '@/lib/constants/commerce';
import { toStorefrontHandle } from '@/lib/shopify/handle';
import { validateEmail } from '@/lib/utils/email';

import type { CartItem } from '@/lib/state/cart';
import type { ProductsResponse } from '@/lib/types/product';
import type { FormEvent, ReactElement } from 'react';

const EMAIL_STORAGE_KEY = 'mo_email';
const ORDER_NUMBER_KEY = 'mo_order_number';
const BOOK_CALL_HREF = 'https://www.maelify.com/pages/contact';

function readLocalStorage(key: string): string {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(key) ?? '';
  } catch {
    return '';
  }
}

function writeSessionStorage(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    /* private mode — silently drop. */
  }
}

/** Synthetic order number for the thank-you page. Shopify uses incremental
 *  six-digit numbers; we generate one client-side so the receipt page can
 *  display it without round-tripping to a backend. */
function mintOrderNumber(): string {
  const base = Math.floor(Math.random() * 900_000) + 100_000;
  return `MO-${base}`;
}

function formatEur(amount: number): string {
  return `€${Math.round(amount).toLocaleString('en-IE')}`;
}

function SummaryRow({ item }: { readonly item: CartItem }): ReactElement {
  const liveImage = useCartImageForHandle(item.handle);
  const displayImage = item.imageUrl || liveImage;
  const total = item.price + (item.engraving?.fee ?? 0);
  return (
    <li className="flex items-start gap-3 py-3">
      <div className="relative h-[56px] w-[56px] shrink-0 overflow-hidden rounded-[6px] border border-[rgba(11,15,14,0.12)] bg-[rgba(11,15,14,0.04)]">
        {displayImage ? (
          <Image src={displayImage} alt={item.title} fill sizes="56px" className="object-cover" />
        ) : null}
        <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#5C6B5A] px-1 font-mono text-[10px] tabular-nums text-[var(--color-paper)]">
          1
        </span>
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

export default function CheckoutPage(): ReactElement {
  const router = useRouter();
  const { items, subtotalEur, setImageForHandle } = useCart();
  const [isMounted, setIsMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const emailId = useId();
  const firstNameId = useId();
  const lastNameId = useId();
  const companyId = useId();

  useEffect(() => {
    setIsMounted(true);
    setEmail(readLocalStorage(EMAIL_STORAGE_KEY));
  }, []);

  // Hydrate the cart store's image map so the summary thumbnails resolve.
  useEffect(() => {
    if (!isMounted) return;
    const abort = new AbortController();
    void (async (): Promise<void> => {
      try {
        const response = await fetch('/api/products', { signal: abort.signal });
        if (!response.ok) return;
        const payload = (await response.json()) as ProductsResponse;
        for (const product of payload.products) {
          const storefrontHandle = toStorefrontHandle(product.handle);
          const image = product.image ?? product.images[0]?.url ?? null;
          if (image) setImageForHandle(storefrontHandle, image);
        }
      } catch {
        /* fire-and-forget */
      }
    })();
    return () => abort.abort();
  }, [isMounted, setImageForHandle]);

  const freeShip = subtotalEur >= FREE_SHIP_THRESHOLD;
  const shipping = freeShip ? 0 : FLAT_SHIPPING_EUR;
  const total = subtotalEur + shipping;

  useEffect(() => {
    if (!isMounted) return;
    if (items.length === 0) {
      router.replace('/collections/edition-01');
    }
  }, [isMounted, items.length, router]);

  const itemNames = useMemo(() => items.map((item) => item.title).join(' · '), [items]);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>): void => {
      event.preventDefault();
      const validation = validateEmail(email);
      if (!validation.ok) {
        setError(
          validation.reason === 'typo'
            ? 'Looks like a typo in the domain — double-check the TLD.'
            : 'Please enter a valid email.',
        );
        return;
      }
      setError(null);
      setIsSubmitting(true);
      const cleanedEmail = validation.email;
      const orderNumber = mintOrderNumber();
      writeSessionStorage(ORDER_NUMBER_KEY, orderNumber);
      try {
        window.localStorage.setItem(EMAIL_STORAGE_KEY, cleanedEmail);
      } catch {
        /* ignore */
      }
      track('portfolio_checkout_submitted', {
        params: {
          first_name: firstName || undefined,
          last_name: lastName || undefined,
          company: company || undefined,
          order_number: orderNumber,
          item_count: items.length,
          subtotal_eur: subtotalEur,
          total_eur: total,
          items: itemNames,
        },
        fanout: { klaviyo: true, email: cleanedEmail },
      });
      track(ECOMMERCE_EVENTS.beginCheckout, {
        ecommerce: {
          currency: 'EUR',
          value: total,
          items: items.map((item, index) => ({
            item_id: item.handle,
            item_name: item.title,
            item_brand: 'Manifest Office',
            price: item.price,
            quantity: 1,
            currency: 'EUR',
            index,
          })),
        },
        fanout: { klaviyo: true, email: cleanedEmail },
      });
      router.push('/checkout/thank-you');
    },
    [company, email, firstName, itemNames, items, lastName, router, subtotalEur, total],
  );

  if (!isMounted) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--color-lichen)]">
        Preparing checkout…
      </div>
    );
  }
  if (items.length === 0) return <div />;

  return (
    <div className="bg-[var(--color-paper)] text-[var(--color-ink)]">
      {/* Header — narrow, secure-checkout style. */}
      <header className="border-b border-[rgba(11,15,14,0.10)] bg-[var(--color-paper)]">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between px-5 py-5 sm:px-8">
          <Link
            href="/"
            className="font-display text-[18px] font-medium tracking-[-0.005em] text-[var(--color-ink)]"
          >
            Manifest Office
          </Link>
          <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--color-lichen)]">
            <svg viewBox="0 0 16 16" className="h-3 w-3" aria-hidden="true">
              <path
                d="M4 7V5a4 4 0 1 1 8 0v2h1v7H3V7h1Zm2 0h4V5a2 2 0 1 0-4 0v2Z"
                fill="currentColor"
              />
            </svg>
            Secure checkout
          </span>
        </div>
      </header>

      {/* Two-column body: form on the left, summary on the right.
          Stacks on mobile (summary appears as a collapsible at the top of
          the page on real Shopify checkout — we render it after the form
          for now to keep the demo focused). */}
      <div className="mx-auto grid max-w-[1180px] grid-cols-1 lg:grid-cols-[1fr_440px]">
        {/* ── Form column ─────────────────────────────────────────── */}
        <section className="px-5 py-8 sm:px-8 lg:pr-12 lg:py-12">
          {/* Pitch card — discloses the trick before the form even starts. */}
          <div className="mb-9 border border-[var(--color-rule-strong)] bg-[rgba(210,74,31,0.06)] px-5 py-4 text-[13px] leading-[1.5] text-[var(--color-ink)]">
            <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-signal)]">
              PORTFOLIO CHECKOUT
            </span>
            <p className="mt-1.5">
              This is the funnel for a fictional brand. The form is a lead capture. The Pay button
              books a call. If this is the kind of checkout you want for your own storefront,
              that&apos;s exactly what we&apos;ll talk about.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {/* Express row — replaces Apple Pay / Shop Pay grid with direct
                "express call" buttons. Same visual weight as real express
                checkout so the parallel reads. */}
            <div className="mb-8">
              <span className="block text-center font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-lichen)]">
                Express
              </span>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Link
                  href={BOOK_CALL_HREF}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-[44px] items-center justify-center rounded-[4px] bg-[var(--color-ink)] font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-paper)] transition-[background-color] hover:bg-[var(--color-signal)]"
                >
                  Book a 30-min call
                </Link>
                <a
                  href="mailto:hello@maelify.com?subject=Manifest%20Office%20demo"
                  className="flex h-[44px] items-center justify-center rounded-[4px] border border-[var(--color-rule-strong)] font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-ink)] transition-colors hover:border-[var(--color-ink)] hover:text-[var(--color-signal)]"
                >
                  Email Jose directly
                </a>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <span className="h-px flex-1 bg-[rgba(11,15,14,0.10)]" />
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-lichen)]">
                  OR LEAVE A NOTE
                </span>
                <span className="h-px flex-1 bg-[rgba(11,15,14,0.10)]" />
              </div>
            </div>

            {/* Contact */}
            <fieldset className="border-0 p-0">
              <legend className="mb-4 font-display text-[18px] font-medium tracking-[-0.005em]">
                Contact
              </legend>
              <div className="relative">
                <label
                  htmlFor={emailId}
                  className="absolute left-3 top-2 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-lichen)]"
                >
                  Email
                </label>
                <input
                  id={emailId}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError(null);
                  }}
                  aria-invalid={error !== null}
                  className="h-[58px] w-full rounded-[4px] border border-[rgba(11,15,14,0.18)] bg-[var(--color-paper)] px-3 pt-5 pb-1.5 text-[15px] text-[var(--color-ink)] outline-none transition-[border-color,box-shadow] focus:border-[var(--color-ink)] focus:shadow-[0_0_0_3px_rgba(11,15,14,0.12)]"
                />
              </div>
              {error ? (
                <p
                  role="alert"
                  className="mt-2 font-mono text-[11px] tracking-[0.04em] text-[var(--color-signal)]"
                >
                  {error}
                </p>
              ) : null}
            </fieldset>

            {/* "Delivery" section — repurposed as the qualification fields a
                real intro call would want. Optional except for email. */}
            <fieldset className="mt-9 border-0 p-0">
              <legend className="mb-4 font-display text-[18px] font-medium tracking-[-0.005em]">
                How can I help?
              </legend>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="relative">
                  <label
                    htmlFor={firstNameId}
                    className="absolute left-3 top-2 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-lichen)]"
                  >
                    First name
                  </label>
                  <input
                    id={firstNameId}
                    type="text"
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    className="h-[58px] w-full rounded-[4px] border border-[rgba(11,15,14,0.18)] bg-[var(--color-paper)] px-3 pt-5 pb-1.5 text-[15px] text-[var(--color-ink)] outline-none transition-[border-color,box-shadow] focus:border-[var(--color-ink)] focus:shadow-[0_0_0_3px_rgba(11,15,14,0.12)]"
                  />
                </div>
                <div className="relative">
                  <label
                    htmlFor={lastNameId}
                    className="absolute left-3 top-2 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-lichen)]"
                  >
                    Last name
                  </label>
                  <input
                    id={lastNameId}
                    type="text"
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    className="h-[58px] w-full rounded-[4px] border border-[rgba(11,15,14,0.18)] bg-[var(--color-paper)] px-3 pt-5 pb-1.5 text-[15px] text-[var(--color-ink)] outline-none transition-[border-color,box-shadow] focus:border-[var(--color-ink)] focus:shadow-[0_0_0_3px_rgba(11,15,14,0.12)]"
                  />
                </div>
                <div className="relative sm:col-span-2">
                  <label
                    htmlFor={companyId}
                    className="absolute left-3 top-2 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-lichen)]"
                  >
                    Company or brand (optional)
                  </label>
                  <input
                    id={companyId}
                    type="text"
                    autoComplete="organization"
                    value={company}
                    onChange={(event) => setCompany(event.target.value)}
                    className="h-[58px] w-full rounded-[4px] border border-[rgba(11,15,14,0.18)] bg-[var(--color-paper)] px-3 pt-5 pb-1.5 text-[15px] text-[var(--color-ink)] outline-none transition-[border-color,box-shadow] focus:border-[var(--color-ink)] focus:shadow-[0_0_0_3px_rgba(11,15,14,0.12)]"
                  />
                </div>
              </div>
              <p className="mt-3 font-mono text-[10px] leading-[1.6] uppercase tracking-[0.04em] text-[var(--color-lichen)]">
                Real checkout collects an address. This one collects context. Same conversion goal,
                different stack.
              </p>
            </fieldset>

            {/* Payment section — fake card row that mirrors Shopify's "Pay
                with card" style but is non-interactive. The visible parity
                sells the trick before the CTA discloses it. */}
            <fieldset className="mt-9 border-0 p-0">
              <legend className="mb-4 font-display text-[18px] font-medium tracking-[-0.005em]">
                Payment
              </legend>
              <div className="rounded-[4px] border border-[rgba(11,15,14,0.18)]">
                <div className="border-b border-[rgba(11,15,14,0.10)] px-4 py-4 text-[14px]">
                  <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--color-lichen)]">
                    No card needed
                  </span>
                  <p className="mt-1 text-[var(--color-ink)]">
                    This checkout is a portfolio piece. The button below books a call instead of
                    charging a card.
                  </p>
                </div>
                <div className="px-4 py-4 font-mono text-[11px] uppercase tracking-[0.04em] text-[var(--color-lichen)]">
                  → REAL VERSION FOR YOUR BRAND? THAT&apos;S THE CALL.
                </div>
              </div>
            </fieldset>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-9 flex h-[58px] w-full items-center justify-center rounded-[4px] bg-[var(--color-ink)] font-mono text-[13px] font-medium uppercase tracking-[0.14em] text-[var(--color-paper)] transition-[background-color,letter-spacing] duration-[280ms] ease-out hover:bg-[var(--color-signal)] hover:tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Booking…' : 'Book the call →'}
            </button>

            <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-lichen)]">
              By submitting, you agree to be contacted about the demo. No drip. No spam.
            </p>
          </form>
        </section>

        {/* ── Order summary ─────────────────────────────────────────── */}
        <aside
          aria-label="Order summary"
          className="border-t border-[rgba(11,15,14,0.10)] bg-[rgba(11,15,14,0.04)] px-5 py-8 sm:px-8 lg:border-t-0 lg:border-l lg:py-12"
        >
          <h2 className="font-display text-[18px] font-medium tracking-[-0.005em]">
            Your manifest
          </h2>
          <ul className="mt-4 divide-y divide-[rgba(11,15,14,0.10)] border-t border-b border-[rgba(11,15,14,0.10)]">
            {items.map((item) => (
              <SummaryRow
                key={`${item.handle}::${item.engraving?.text ?? ''}::${item.issuedAs ?? 'x'}`}
                item={item}
              />
            ))}
          </ul>

          <dl className="mt-5 flex flex-col gap-2 text-[14px]">
            <div className="flex items-baseline justify-between">
              <dt className="text-[var(--color-ink)]/85">Subtotal</dt>
              <dd className="font-mono tabular-nums">{formatEur(subtotalEur)}</dd>
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
            <span className="font-display text-[24px] font-medium tabular-nums tracking-[-0.01em]">
              {formatEur(total)}
            </span>
          </div>

          <p className="mt-6 font-mono text-[10px] uppercase leading-[1.7] tracking-[0.06em] text-[var(--color-lichen)]">
            Manifest Office is a demo. The cart total is for illustration. No charge will be placed.
            Booking the call is the actual conversion.
          </p>
        </aside>
      </div>
    </div>
  );
}
