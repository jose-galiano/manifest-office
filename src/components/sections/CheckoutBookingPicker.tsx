'use client';

import { useId, useMemo } from 'react';

import type { ReactElement } from 'react';

export type BookingSlot = {
  readonly iso: string;
  readonly dateLabel: string;
  readonly timeLabel: string;
  readonly weekdayShort: string;
  readonly dayOfMonth: string;
  readonly monthShort: string;
};

const SLOT_HOURS: readonly { hour: number; minute: number; label: string }[] = [
  { hour: 9, minute: 30, label: '09:30' },
  { hour: 11, minute: 0, label: '11:00' },
  { hour: 14, minute: 30, label: '14:30' },
  { hour: 16, minute: 0, label: '16:00' },
];

const WEEKDAYS_SHORT = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTHS_SHORT = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
];

type DayBucket = {
  readonly key: string;
  readonly date: Date;
  readonly weekdayShort: string;
  readonly dayOfMonth: string;
  readonly monthShort: string;
  readonly slots: readonly BookingSlot[];
};

// Deterministic pseudo-availability so the same date/slot pair always shows
// the same state across renders without needing a backend. Hash the ISO
// minute into a stable bit per slot.
function isSlotAvailable(iso: string): boolean {
  let hash = 0;
  for (let i = 0; i < iso.length; i += 1) {
    hash = (hash * 31 + iso.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 7 !== 0;
}

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function buildSlots(now: Date): readonly DayBucket[] {
  const buckets: DayBucket[] = [];
  const cursor = startOfDay(now);
  // Advance to tomorrow as earliest bookable day.
  cursor.setDate(cursor.getDate() + 1);
  let added = 0;
  while (added < 7) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) {
      const slots: BookingSlot[] = SLOT_HOURS.map(({ hour, minute, label }) => {
        const slotDate = new Date(cursor);
        slotDate.setHours(hour, minute, 0, 0);
        return {
          iso: slotDate.toISOString(),
          dateLabel: `${WEEKDAYS_SHORT[day]} ${String(cursor.getDate()).padStart(2, '0')} ${MONTHS_SHORT[cursor.getMonth()]}`,
          timeLabel: label,
          weekdayShort: WEEKDAYS_SHORT[day] ?? '',
          dayOfMonth: String(cursor.getDate()).padStart(2, '0'),
          monthShort: MONTHS_SHORT[cursor.getMonth()] ?? '',
        };
      });
      buckets.push({
        key: cursor.toISOString().slice(0, 10),
        date: new Date(cursor),
        weekdayShort: WEEKDAYS_SHORT[day] ?? '',
        dayOfMonth: String(cursor.getDate()).padStart(2, '0'),
        monthShort: MONTHS_SHORT[cursor.getMonth()] ?? '',
        slots,
      });
      added += 1;
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return buckets;
}

type CheckoutBookingPickerProps = {
  readonly selected: BookingSlot | null;
  readonly onSelect: (slot: BookingSlot) => void;
};

export function CheckoutBookingPicker({
  selected,
  onSelect,
}: CheckoutBookingPickerProps): ReactElement {
  const titleId = useId();
  const days = useMemo(() => buildSlots(new Date()), []);

  return (
    <fieldset className="border-0 p-0" aria-labelledby={titleId}>
      <legend
        id={titleId}
        className="mb-4 font-display text-[18px] font-medium tracking-[-0.005em]"
      >
        Pick a 30-minute call
      </legend>
      <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-lichen)]">
        Next 7 weekdays · CET · 30-min default
      </p>

      <div className="rounded-[4px] border border-[rgba(11,15,14,0.18)] bg-[var(--color-paper)]">
        <div className="grid grid-cols-1 divide-y divide-[rgba(11,15,14,0.10)] sm:grid-cols-[140px_1fr] sm:divide-y-0">
          {/* Day rail */}
          <div className="hidden border-r border-[rgba(11,15,14,0.10)] sm:block">
            {days.map((day) => {
              const dayActive = selected !== null && day.key === selected.iso.slice(0, 10);
              return (
                <div
                  key={day.key}
                  className={[
                    'flex items-baseline gap-2 border-b border-[rgba(11,15,14,0.06)] px-5 py-4 last:border-b-0 font-mono text-[10px] uppercase tracking-[0.1em]',
                    dayActive
                      ? 'bg-[rgba(210,74,31,0.05)] text-[var(--color-ink)]'
                      : 'text-[var(--color-lichen)]',
                  ].join(' ')}
                >
                  <span className="text-[var(--color-ink)] font-display text-[18px] tabular-nums leading-none">
                    {day.dayOfMonth}
                  </span>
                  <span>
                    {day.weekdayShort} · {day.monthShort}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Slots grid */}
          <div className="divide-y divide-[rgba(11,15,14,0.10)]">
            {days.map((day) => (
              <div
                key={day.key}
                className="grid grid-cols-[88px_1fr] items-stretch sm:grid-cols-[1fr]"
              >
                <div className="flex items-center gap-2 border-r border-[rgba(11,15,14,0.10)] px-4 py-4 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-lichen)] sm:hidden">
                  <span className="font-display text-[18px] tabular-nums leading-none text-[var(--color-ink)]">
                    {day.dayOfMonth}
                  </span>
                  <span>{day.weekdayShort}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4 sm:p-4">
                  {day.slots.map((slot) => {
                    const available = isSlotAvailable(slot.iso);
                    const isSelected = selected !== null && selected.iso === slot.iso;
                    return (
                      <button
                        key={slot.iso}
                        type="button"
                        disabled={!available}
                        onClick={() => onSelect(slot)}
                        aria-pressed={isSelected}
                        className={[
                          'flex h-[44px] items-center justify-center rounded-[4px] border font-mono text-[12px] tabular-nums transition-[background-color,border-color,color] duration-200',
                          isSelected
                            ? 'border-[var(--color-signal-text-paper)] bg-[var(--color-signal-text-paper)] text-[var(--color-paper)]'
                            : available
                              ? 'border-[rgba(11,15,14,0.18)] bg-[var(--color-paper)] text-[var(--color-ink)] hover:border-[var(--color-ink)] hover:bg-[rgba(11,15,14,0.04)]'
                              : 'border-[rgba(11,15,14,0.10)] bg-[rgba(11,15,14,0.04)] text-[var(--color-lichen)] line-through cursor-not-allowed',
                        ].join(' ')}
                      >
                        {slot.timeLabel}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        className="mt-3 flex flex-wrap items-baseline justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-lichen)]"
        role="status"
        aria-live="polite"
      >
        <span>
          {selected
            ? `Selected · ${selected.dateLabel} · ${selected.timeLabel} CET`
            : 'No slot selected yet'}
        </span>
        <span>Calendar invite mails on confirm.</span>
      </div>
    </fieldset>
  );
}
