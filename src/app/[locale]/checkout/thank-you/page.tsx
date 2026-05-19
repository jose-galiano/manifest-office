'use client';

import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';

import { useCart, useCartImageForHandle } from '@/hooks/use-cart';
import { Link } from '@/i18n/navigation';
import { type Locale } from '@/i18n/routing';
import { CUSTOM_EVENTS, ECOMMERCE_EVENTS, track } from '@/lib/analytics';
import { FLAT_SHIPPING_EUR, FREE_SHIP_THRESHOLD } from '@/lib/constants/commerce';
import { formatPriceForLocale, resolveCurrency } from '@/lib/i18n/currency';

import type { CartItem } from '@/lib/state/cart';
import type { ReactElement } from 'react';

const EMAIL_STORAGE_KEY = 'mo_email';
const ORDER_NUMBER_KEY = 'mo_order_number';
const BOOKING_PAYLOAD_KEY = 'mo_booking_payload';
const CAL_EMBED_URL = process.env.NEXT_PUBLIC_CAL_LINK?.trim() ?? '';
const BOOK_CALL_HREF = 'https://www.maelify.com/pages/book';

type BookingPayload = {
  email?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  role?: string;
  plan?: string;
  wouldHavePaid?: boolean;
  icpMatch?: boolean;
  itemCount?: number;
  subtotalEur?: number;
  totalEur?: number;
  itemNames?: string;
  bookingIso?: string;
  bookingDateLabel?: string;
  bookingTimeLabel?: string;
};

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

function readBookingPayload(): BookingPayload {
  const raw = readSession(BOOKING_PAYLOAD_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    return typeof parsed === 'object' && parsed !== null ? (parsed as BookingPayload) : {};
  } catch {
    return {};
  }
}

function buildCalIframeUrl(base: string, payload: BookingPayload): string {
  try {
    const url = new URL(base);
    if (payload.email) url.searchParams.set('email', payload.email);
    const name = [payload.firstName, payload.lastName].filter(Boolean).join(' ').trim();
    if (name) url.searchParams.set('name', name);
    if (payload.company) url.searchParams.set('metadata[company]', payload.company);
    if (payload.role) url.searchParams.set('metadata[role]', payload.role);
    if (payload.plan) url.searchParams.set('metadata[shopify_plan]', payload.plan);
    if (payload.totalEur !== undefined) {
      url.searchParams.set('metadata[cart_total_eur]', String(payload.totalEur));
    }
    if (payload.wouldHavePaid !== undefined) {
      url.searchParams.set('metadata[would_have_paid]', payload.wouldHavePaid ? 'true' : 'false');
    }
    url.searchParams.set('embed', 'true');
    return url.toString();
  } catch {
    return base;
  }
}

function ReceiptRow({
  item,
  locale,
}: {
  readonly item: CartItem;
  readonly locale: Locale;
}): ReactElement {
  const liveImage = useCartImageForHandle(item.handle);
  const t = useTranslations('thank_you');
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

export default function ThankYouPage(): ReactElement {
  const locale = useLocale() as Locale;
  const t = useTranslations('thank_you');
  const { items, subtotalEur, clear } = useCart();
  const [orderNumber, setOrderNumber] = useState('MO-000000');
  const [email, setEmail] = useState('');
  const [snapshot, setSnapshot] = useState<readonly CartItem[]>([]);
  const [snapshotSubtotal, setSnapshotSubtotal] = useState<number>(0);
  const [bookingPayload, setBookingPayload] = useState<BookingPayload>({});

  useEffect(() => {
    const order = readSession(ORDER_NUMBER_KEY) || 'MO-000000';
    const payload = readBookingPayload();
    setOrderNumber(order);
    setEmail(payload.email || readLocal(EMAIL_STORAGE_KEY));
    setSnapshot(items);
    setSnapshotSubtotal(subtotalEur);
    setBookingPayload(payload);
    const ecommerceItems = items.map((item, index) => ({
      item_id: item.handle,
      item_name: item.title,
      item_brand: 'Manifest Office',
      price: item.price,
      quantity: 1,
      currency: 'EUR',
      index,
    }));
    const total = subtotalEur + (subtotalEur >= FREE_SHIP_THRESHOLD ? 0 : FLAT_SHIPPING_EUR);
    track(CUSTOM_EVENTS.callBookedConfirmationView, {
      params: {
        order_number: order,
        role: payload.role,
        shopify_plan: payload.plan,
        would_have_paid: payload.wouldHavePaid,
        icp_match: payload.icpMatch,
        item_count: items.length,
        subtotal_eur: subtotalEur,
        total_eur: total,
        items: payload.itemNames,
      },
      ecommerce: { currency: 'EUR', value: total, items: ecommerceItems },
      fanout: payload.email ? { klaviyo: true, email: payload.email } : undefined,
    });
    track(ECOMMERCE_EVENTS.beginCheckout, {
      ecommerce: { currency: 'EUR', value: total, items: ecommerceItems },
    });
    const handle = window.setTimeout(() => clear(), 200);
    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const freeShip = snapshotSubtotal >= FREE_SHIP_THRESHOLD;
  const shipping = freeShip ? 0 : FLAT_SHIPPING_EUR;
  const total = snapshotSubtotal + shipping;

  const firstName = useMemo(() => {
    if (bookingPayload.firstName) return bookingPayload.firstName;
    return email.split('@')[0] || t('friend_fallback');
  }, [bookingPayload.firstName, email, t]);

  const calIframeUrl = useMemo(() => {
    if (!CAL_EMBED_URL) return '';
    return buildCalIframeUrl(CAL_EMBED_URL, bookingPayload);
  }, [bookingPayload]);

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
            {t('order_confirmation')}
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-[760px] px-5 py-12 sm:px-8 sm:py-16">
        <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-signal">
          ✓ {t('call_booked').toUpperCase()}
        </span>
        <h1 className="mt-3 font-display text-[36px] font-medium leading-[1.05] tracking-[-0.015em] sm:text-[48px]">
          {t('confirmed_heading', { name: firstName })}
        </h1>
        {bookingPayload.bookingDateLabel && bookingPayload.bookingTimeLabel ? (
          <div className="mt-6 inline-flex flex-col items-start gap-1 rounded-[4px] border border-[var(--color-ink)] bg-[var(--color-ink)] px-5 py-4 text-[var(--color-paper)] sm:flex-row sm:items-baseline sm:gap-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-paper)]/70">
              {t('slot_held')}
            </span>
            <span className="font-display text-[18px] font-medium tracking-[-0.005em] sm:text-[20px]">
              {bookingPayload.bookingDateLabel} · {bookingPayload.bookingTimeLabel} CET
            </span>
          </div>
        ) : null}
        <p className="mt-5 max-w-[52ch] text-[16px] leading-[1.6] text-[var(--color-ink)]/85">
          {t.rich('invite_lede', {
            email: () => (
              <span className="font-mono text-[14px] text-[var(--color-ink)]">
                {email || t('your_email_fallback')}
              </span>
            ),
          })}
        </p>

        <section
          aria-label={t('cover_label')}
          className="mt-9 border-l-2 border-[var(--color-signal)] bg-[rgba(210,74,31,0.04)] px-5 py-5"
        >
          <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-signal">
            {t('cover_eyebrow')}
          </span>
          <ul className="mt-3 space-y-2 text-[14px] leading-[1.55] text-[var(--color-ink)]">
            <li className="flex gap-3">
              <span aria-hidden="true" className="font-mono text-signal">
                →
              </span>
              <span>{t('cover_1')}</span>
            </li>
            <li className="flex gap-3">
              <span aria-hidden="true" className="font-mono text-signal">
                →
              </span>
              <span>
                {t('cover_2', { company: bookingPayload.company || t('your_brand_fallback') })}
              </span>
            </li>
            <li className="flex gap-3">
              <span aria-hidden="true" className="font-mono text-signal">
                →
              </span>
              <span>{t('cover_3')}</span>
            </li>
          </ul>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-lichen)]">
            {t('cover_caption')}
          </p>
        </section>

        {calIframeUrl ? (
          <section
            aria-label={t('pick_slot_label')}
            className="mt-10 overflow-hidden rounded-[6px] border border-[rgba(11,15,14,0.12)] bg-[var(--color-paper)]"
          >
            <div className="border-b border-[rgba(11,15,14,0.10)] px-5 py-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-lichen)]">
                {t('pick_your_slot')}
              </span>
            </div>
            <iframe
              src={calIframeUrl}
              title={t('cal_iframe_title')}
              loading="lazy"
              className="h-[720px] w-full border-0"
              allow="camera; microphone; autoplay; encrypted-media; fullscreen"
            />
          </section>
        ) : (
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href={BOOK_CALL_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-[48px] items-center justify-center rounded-[4px] bg-[var(--color-ink)] px-6 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-paper)] transition-[background-color,letter-spacing] duration-[280ms] hover:bg-[var(--color-signal)] hover:tracking-[0.18em]"
            >
              {t('book_now_cta')}
            </Link>
            <Link
              href="/"
              className="flex h-[48px] items-center justify-center rounded-[4px] border border-[var(--color-rule-strong)] px-6 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-ink)] transition-colors hover:border-[var(--color-ink)] hover:text-signal"
            >
              {t('keep_exploring')}
            </Link>
          </div>
        )}

        <section
          aria-label={t('order_summary')}
          className="mt-12 border border-[rgba(11,15,14,0.10)] bg-[rgba(11,15,14,0.04)] px-5 py-7 sm:px-7"
        >
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-[18px] font-medium tracking-[-0.005em]">
              {t('order_summary')}
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
                    locale={locale}
                  />
                ))}
              </ul>

              <dl className="mt-5 flex flex-col gap-2 text-[14px]">
                <div className="flex items-baseline justify-between">
                  <dt className="text-[var(--color-ink)]/85">{t('subtotal')}</dt>
                  <dd className="font-mono tabular-nums">
                    {formatPriceForLocale(snapshotSubtotal, locale)}
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
                <span className="font-display text-[22px] font-medium tabular-nums tracking-[-0.01em]">
                  {formatPriceForLocale(total, locale)}
                </span>
              </div>
            </>
          ) : (
            <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--color-lichen)]">
              {t('no_items')}
            </p>
          )}
        </section>

        <p className="mt-12 max-w-[58ch] text-[14px] leading-[1.6] text-[var(--color-ink)]/85">
          {t.rich('portfolio_signoff', {
            strong: (chunks) => <strong>{chunks}</strong>,
            link: (chunks) => (
              <a
                href="https://github.com/jose-galiano/manifest-office"
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-[var(--color-rule-strong)] underline-offset-[3px] transition-colors hover:text-signal hover:decoration-[var(--color-signal)]"
              >
                {chunks}
              </a>
            ),
          })}
        </p>
      </div>
    </div>
  );
}
