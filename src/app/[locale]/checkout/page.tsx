'use client';

import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';

import {
  CheckoutBookingPicker,
  type BookingSlot,
} from '@/components/sections/CheckoutBookingPicker';
import { useCart, useCartImageForHandle } from '@/hooks/use-cart';
import { Link, useRouter } from '@/i18n/navigation';
import { type Locale } from '@/i18n/routing';
import { CUSTOM_EVENTS, ECOMMERCE_EVENTS, track } from '@/lib/analytics';
import { FLAT_SHIPPING_EUR, FREE_SHIP_THRESHOLD } from '@/lib/constants/commerce';
import { formatPriceForLocale, resolveCurrency } from '@/lib/i18n/currency';
import { toStorefrontHandle } from '@/lib/shopify/handle';
import { validateEmail } from '@/lib/utils/email';

import type { CartItem } from '@/lib/state/cart';
import type { ProductsResponse } from '@/lib/types/product';
import type { FormEvent, ReactElement } from 'react';

const EMAIL_STORAGE_KEY = 'mo_email';
const ORDER_NUMBER_KEY = 'mo_order_number';
const BOOKING_PAYLOAD_KEY = 'mo_booking_payload';
const BOOK_CALL_HREF = 'https://www.maelify.com/pages/book';

const ROLE_VALUES = [
  '',
  'founder',
  'cto',
  'growth',
  'product',
  'designer',
  'student',
  'other',
] as const;
const PLAN_VALUES = [
  '',
  'plus',
  'advanced',
  'basic',
  'considering',
  'other_platform',
  'na',
] as const;

const ICP_ROLES: ReadonlySet<string> = new Set(['founder', 'cto', 'growth', 'product']);
const ICP_PLANS: ReadonlySet<string> = new Set(['plus', 'advanced']);

function computeIcpMatch(role: string, plan: string): boolean {
  return ICP_ROLES.has(role) || ICP_PLANS.has(plan);
}

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
    /* private mode */
  }
}

function mintOrderNumber(): string {
  const base = Math.floor(Math.random() * 900_000) + 100_000;
  return `MO-${base}`;
}

function SummaryRow({
  item,
  locale,
}: {
  readonly item: CartItem;
  readonly locale: Locale;
}): ReactElement {
  const liveImage = useCartImageForHandle(item.handle);
  const t = useTranslations('checkout');
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
            {t('engraved_with', { text: item.engraving.text })}
          </div>
        ) : null}
      </div>
      <div className="font-mono text-[13px] tabular-nums text-[var(--color-ink)]">
        {formatPriceForLocale(total, locale)}
      </div>
    </li>
  );
}

export default function CheckoutPage(): ReactElement {
  const router = useRouter();
  const locale = useLocale() as Locale;
  const t = useTranslations('checkout');
  const roleOptions = useMemo(
    () =>
      ROLE_VALUES.map((value) => ({ value, label: t(`role_options.${value || 'placeholder'}`) })),
    [t],
  );
  const planOptions = useMemo(
    () =>
      PLAN_VALUES.map((value) => ({ value, label: t(`plan_options.${value || 'placeholder'}`) })),
    [t],
  );
  const { items, subtotalEur, setImageForHandle } = useCart();
  const [isMounted, setIsMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [plan, setPlan] = useState('');
  const [wouldHavePaid, setWouldHavePaid] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const emailId = useId();
  const firstNameId = useId();
  const lastNameId = useId();
  const companyId = useId();
  const roleId = useId();
  const planId = useId();
  const wouldHavePaidId = useId();

  useEffect(() => {
    setIsMounted(true);
    setEmail(readLocalStorage(EMAIL_STORAGE_KEY));
  }, []);

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
    if (items.length === 0) return;
    track(CUSTOM_EVENTS.checkoutView, {
      params: {
        item_count: items.length,
        subtotal_eur: subtotalEur,
        total_eur: total,
      },
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
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    if (items.length === 0) {
      router.replace('/collections/edition-01');
    }
  }, [isMounted, items.length, router]);

  const itemNames = useMemo(() => items.map((item) => item.title).join(' · '), [items]);

  const handleExpressClick = useCallback((variant: 'book_now' | 'email_direct'): void => {
    track(CUSTOM_EVENTS.checkoutExpressClick, {
      params: { variant },
    });
  }, []);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>): void => {
      event.preventDefault();
      const validation = validateEmail(email);
      if (!validation.ok) {
        setError(validation.reason === 'typo' ? t('error.email_typo') : t('error.email_invalid'));
        return;
      }
      if (!role) {
        setError(t('error.role_required'));
        return;
      }
      if (!plan) {
        setError(t('error.plan_required'));
        return;
      }
      if (!selectedSlot) {
        setError(t('error.slot_required'));
        return;
      }
      setError(null);
      setIsSubmitting(true);
      const cleanedEmail = validation.email;
      const orderNumber = mintOrderNumber();
      const icpMatch = computeIcpMatch(role, plan);
      writeSessionStorage(ORDER_NUMBER_KEY, orderNumber);
      writeSessionStorage(
        BOOKING_PAYLOAD_KEY,
        JSON.stringify({
          email: cleanedEmail,
          firstName,
          lastName,
          company,
          role,
          plan,
          wouldHavePaid,
          icpMatch,
          itemCount: items.length,
          subtotalEur,
          totalEur: total,
          itemNames,
          bookingIso: selectedSlot.iso,
          bookingDateLabel: selectedSlot.dateLabel,
          bookingTimeLabel: selectedSlot.timeLabel,
        }),
      );
      try {
        window.localStorage.setItem(EMAIL_STORAGE_KEY, cleanedEmail);
      } catch {
        /* ignore */
      }
      track(CUSTOM_EVENTS.bookCall, {
        params: {
          first_name: firstName || undefined,
          last_name: lastName || undefined,
          company: company || undefined,
          role,
          shopify_plan: plan,
          would_have_paid: wouldHavePaid,
          icp_match: icpMatch,
          order_number: orderNumber,
          item_count: items.length,
          subtotal_eur: subtotalEur,
          total_eur: total,
          items: itemNames,
          booking_iso: selectedSlot.iso,
          booking_date: selectedSlot.dateLabel,
          booking_time: selectedSlot.timeLabel,
        },
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
      track(ECOMMERCE_EVENTS.generateLead, {
        params: { method: 'portfolio_checkout', would_have_paid: wouldHavePaid },
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
      });
      router.push('/checkout/thank-you');
    },
    [
      company,
      email,
      firstName,
      itemNames,
      items,
      lastName,
      plan,
      role,
      router,
      selectedSlot,
      subtotalEur,
      t,
      total,
      wouldHavePaid,
    ],
  );

  if (!isMounted) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--color-lichen)]">
        {t('loading')}
      </div>
    );
  }
  if (items.length === 0) return <div />;

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
          <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--color-lichen)]">
            <svg viewBox="0 0 16 16" className="h-3 w-3" aria-hidden="true">
              <path
                d="M4 7V5a4 4 0 1 1 8 0v2h1v7H3V7h1Zm2 0h4V5a2 2 0 1 0-4 0v2Z"
                fill="currentColor"
              />
            </svg>
            {t('secure_checkout')}
          </span>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1180px] grid-cols-1 lg:grid-cols-[1fr_440px]">
        <section className="px-5 py-8 sm:px-8 lg:pr-12 lg:py-12">
          <div className="mb-9 border border-[var(--color-rule-strong)] bg-[rgba(210,74,31,0.06)] px-5 py-4 text-[13px] leading-[1.5] text-[var(--color-ink)]">
            <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-signal">
              {t('portfolio_eyebrow').toUpperCase()}
            </span>
            <p className="mt-1.5">{t('portfolio_body')}</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-8">
              <span className="block text-center font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-lichen)]">
                {t('express')}
              </span>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Link
                  href={BOOK_CALL_HREF}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleExpressClick('book_now')}
                  className="flex h-[44px] items-center justify-center rounded-[4px] bg-[var(--color-ink)] font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-paper)] transition-[background-color] hover:bg-[var(--color-signal)]"
                >
                  {t('book_call')}
                </Link>
                <a
                  href="mailto:hello@maelify.com?subject=Manifest%20Office%20demo"
                  onClick={() => handleExpressClick('email_direct')}
                  className="flex h-[44px] items-center justify-center rounded-[4px] border border-[var(--color-rule-strong)] font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-ink)] transition-colors hover:border-[var(--color-ink)] hover:text-signal"
                >
                  {t('email_direct')}
                </a>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <span className="h-px flex-1 bg-[rgba(11,15,14,0.10)]" />
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-lichen)]">
                  {t('or_leave_note').toUpperCase()}
                </span>
                <span className="h-px flex-1 bg-[rgba(11,15,14,0.10)]" />
              </div>
            </div>

            <fieldset className="border-0 p-0">
              <legend className="mb-4 font-display text-[18px] font-medium tracking-[-0.005em]">
                {t('contact')}
              </legend>
              <div className="relative">
                <label
                  htmlFor={emailId}
                  className="absolute left-3 top-2 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-lichen)]"
                >
                  {t('email_label')}
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
                  className="mt-2 font-mono text-[11px] tracking-[0.04em] text-signal"
                >
                  {error}
                </p>
              ) : null}
            </fieldset>

            <fieldset className="mt-9 border-0 p-0">
              <legend className="mb-4 font-display text-[18px] font-medium tracking-[-0.005em]">
                {t('help_legend')}
              </legend>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="relative">
                  <label
                    htmlFor={firstNameId}
                    className="absolute left-3 top-2 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-lichen)]"
                  >
                    {t('first_name')}
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
                    {t('last_name')}
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
                    {t('company_label')}
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
                <div className="relative">
                  <label
                    htmlFor={roleId}
                    className="absolute left-3 top-2 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-lichen)]"
                  >
                    {t('role_label')}
                  </label>
                  <select
                    id={roleId}
                    required
                    value={role}
                    onChange={(event) => {
                      setRole(event.target.value);
                      setError(null);
                    }}
                    aria-invalid={error?.includes('role') ? true : undefined}
                    className="h-[58px] w-full appearance-none rounded-[4px] border border-[rgba(11,15,14,0.18)] bg-[var(--color-paper)] px-3 pt-5 pb-1.5 text-[15px] text-[var(--color-ink)] outline-none transition-[border-color,box-shadow] focus:border-[var(--color-ink)] focus:shadow-[0_0_0_3px_rgba(11,15,14,0.12)]"
                  >
                    {roleOptions.map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                        disabled={option.value === ''}
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[12px] text-[var(--color-lichen)]"
                  >
                    ▾
                  </span>
                </div>
                <div className="relative">
                  <label
                    htmlFor={planId}
                    className="absolute left-3 top-2 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-lichen)]"
                  >
                    {t('plan_label')}
                  </label>
                  <select
                    id={planId}
                    required
                    value={plan}
                    onChange={(event) => {
                      setPlan(event.target.value);
                      setError(null);
                    }}
                    aria-invalid={error?.includes('store') ? true : undefined}
                    className="h-[58px] w-full appearance-none rounded-[4px] border border-[rgba(11,15,14,0.18)] bg-[var(--color-paper)] px-3 pt-5 pb-1.5 text-[15px] text-[var(--color-ink)] outline-none transition-[border-color,box-shadow] focus:border-[var(--color-ink)] focus:shadow-[0_0_0_3px_rgba(11,15,14,0.12)]"
                  >
                    {planOptions.map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                        disabled={option.value === ''}
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[12px] text-[var(--color-lichen)]"
                  >
                    ▾
                  </span>
                </div>
              </div>
              <p className="mt-3 font-mono text-[10px] leading-[1.6] uppercase tracking-[0.04em] text-[var(--color-lichen)]">
                {t('context_caption')}
              </p>
            </fieldset>

            <div className="mt-9">
              <CheckoutBookingPicker selected={selectedSlot} onSelect={setSelectedSlot} />
            </div>

            <label
              htmlFor={wouldHavePaidId}
              className="mt-7 flex cursor-pointer items-start gap-3 rounded-[4px] border border-[rgba(11,15,14,0.18)] bg-[var(--color-paper)] px-4 py-3.5 text-[13px] leading-[1.5] text-[var(--color-ink)] transition-[border-color,background-color] hover:border-[var(--color-ink)] hover:bg-[rgba(11,15,14,0.02)]"
            >
              <input
                id={wouldHavePaidId}
                type="checkbox"
                checked={wouldHavePaid}
                onChange={(event) => setWouldHavePaid(event.target.checked)}
                className="mt-0.5 h-4 w-4 cursor-pointer accent-[var(--color-signal)]"
              />
              <span>
                {t.rich('would_pay', {
                  strong: (chunks) => <span className="font-medium">{chunks}</span>,
                })}
              </span>
            </label>

            <button
              type="submit"
              disabled={isSubmitting || !selectedSlot}
              className="mt-7 flex h-[58px] w-full items-center justify-center rounded-[4px] bg-[var(--color-ink)] font-mono text-[13px] font-medium uppercase tracking-[0.14em] text-[var(--color-paper)] transition-[background-color,letter-spacing] duration-[280ms] ease-out hover:bg-[var(--color-signal)] hover:tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? t('submit_busy')
                : selectedSlot
                  ? t('submit_confirm', {
                      date: selectedSlot.dateLabel,
                      time: selectedSlot.timeLabel,
                    })
                  : t('submit_pick_slot')}
            </button>

            <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-lichen)]">
              {t('consent')}
            </p>
          </form>
        </section>

        <aside
          aria-label={t('order_summary')}
          className="border-t border-[rgba(11,15,14,0.10)] bg-[rgba(11,15,14,0.04)] px-5 py-8 sm:px-8 lg:border-t-0 lg:border-l lg:py-12"
        >
          <h2 className="font-display text-[18px] font-medium tracking-[-0.005em]">
            {t('your_manifest')}
          </h2>
          <ul className="mt-4 divide-y divide-[rgba(11,15,14,0.10)] border-t border-b border-[rgba(11,15,14,0.10)]">
            {items.map((item) => (
              <SummaryRow
                key={`${item.handle}::${item.engraving?.text ?? ''}::${item.issuedAs ?? 'x'}`}
                item={item}
                locale={locale}
              />
            ))}
          </ul>

          <dl className="mt-5 flex flex-col gap-2 text-[14px]">
            <div className="flex items-baseline justify-between">
              <dt className="text-[var(--color-ink)]/85">{t('subtotal')}</dt>
              <dd className="font-mono tabular-nums">
                {formatPriceForLocale(subtotalEur, locale)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between">
              <dt className="text-[var(--color-ink)]/85">{t('shipping')}</dt>
              <dd className="font-mono tabular-nums">
                {freeShip
                  ? t('shipping_included')
                  : formatPriceForLocale(FLAT_SHIPPING_EUR, locale)}
              </dd>
            </div>
          </dl>

          <div className="mt-5 flex items-baseline justify-between border-t border-[rgba(11,15,14,0.10)] pt-5">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--color-lichen)]">
              {t('total_currency', { currency: resolveCurrency(locale) })}
            </span>
            <span className="font-display text-[24px] font-medium tabular-nums tracking-[-0.01em]">
              {formatPriceForLocale(total, locale)}
            </span>
          </div>

          <p className="mt-6 font-mono text-[10px] uppercase leading-[1.7] tracking-[0.06em] text-[var(--color-lichen)]">
            {t('demo_caption')}
          </p>
        </aside>
      </div>
    </div>
  );
}
