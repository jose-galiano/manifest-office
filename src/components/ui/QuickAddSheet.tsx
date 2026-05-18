'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

import type { MouseEvent, ReactElement, TouchEvent } from 'react';

export type QuickAddSwatch = {
  readonly name: string;
  readonly hex: string;
  readonly imageUrl: string | null;
};

type QuickAddSheetProps = {
  readonly open: boolean;
  readonly title: string;
  readonly priceEur: number;
  readonly swatches: readonly QuickAddSwatch[];
  readonly initialIndex: number;
  readonly pending: boolean;
  readonly success: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (colorwayIndex: number) => void;
};

const DISMISS_DRAG_PX = 80;

export function QuickAddSheet({
  open,
  title,
  priceEur,
  swatches,
  initialIndex,
  pending,
  success,
  onClose,
  onSubmit,
}: QuickAddSheetProps): ReactElement {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(initialIndex);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const dragStartY = useRef<number | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setSelectedIndex(initialIndex);
      setDragOffset(0);
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, initialIndex]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    function handleClose(): void {
      onClose();
    }
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [onClose]);

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>): void {
    if (event.target === dialogRef.current) onClose();
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>): void {
    const touch = event.touches[0];
    if (!touch) return;
    dragStartY.current = touch.clientY;
  }

  function handleTouchMove(event: TouchEvent<HTMLDivElement>): void {
    if (dragStartY.current === null) return;
    const touch = event.touches[0];
    if (!touch) return;
    const delta = touch.clientY - dragStartY.current;
    if (delta > 0) setDragOffset(delta);
  }

  function handleTouchEnd(): void {
    if (dragOffset > DISMISS_DRAG_PX) {
      onClose();
    }
    setDragOffset(0);
    dragStartY.current = null;
  }

  const activeSwatch = swatches[selectedIndex] ?? swatches[0];
  const heroImage = activeSwatch?.imageUrl ?? swatches[0]?.imageUrl ?? null;
  const ctaLabel = success ? 'Reserved ✓' : pending ? 'Reserving…' : 'Reserve';
  const ctaDisabled = pending || success;

  return (
    <dialog
      ref={dialogRef}
      className="mo-qa"
      onClick={handleBackdropClick}
      aria-label={`Quick add: ${title}`}
    >
      <div
        className="mo-qa__panel"
        style={
          dragOffset ? { transform: `translateY(${dragOffset}px)`, transition: 'none' } : undefined
        }
      >
        <div
          className="mo-qa__handle-zone"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          aria-hidden="true"
        >
          <span className="mo-qa__handle" />
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mo-qa__close"
          aria-label="Close quick add"
        >
          ✕
        </button>

        <div className="mo-qa__body">
          <div className="mo-qa__hero">
            {heroImage ? (
              <Image
                src={heroImage}
                alt={activeSwatch ? `${title} — ${activeSwatch.name}` : title}
                width={400}
                height={500}
                sizes="(max-width: 750px) 40vw, 200px"
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>

          <div className="mo-qa__copy">
            <span className="mo-qa__eyebrow">Quick Reserve</span>
            <h2 className="mo-qa__title">{title}</h2>
            <span className="mo-qa__price">€{Math.round(priceEur)}</span>

            {swatches.length > 1 ? (
              <div className="mo-qa__swatches" role="radiogroup" aria-label="Choose colorway">
                {swatches.map((swatch, index) => {
                  const isActive = index === selectedIndex;
                  return (
                    <button
                      key={swatch.name}
                      type="button"
                      role="radio"
                      aria-checked={isActive}
                      aria-label={swatch.name}
                      onClick={() => setSelectedIndex(index)}
                      className={`mo-qa__swatch ${isActive ? 'is-active' : ''}`}
                    >
                      <span className="mo-qa__swatch-chip" style={{ background: swatch.hex }} />
                      <span className="mo-qa__swatch-name">{swatch.name}</span>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onSubmit(selectedIndex)}
          disabled={ctaDisabled}
          className={`mo-qa__cta ${success ? 'is-success' : ''}`}
        >
          {ctaLabel}
        </button>
      </div>

      <style>{`
        .mo-qa { padding: 0; border: 0; background: transparent; max-width: 100vw; max-height: 100vh; }
        .mo-qa::backdrop { background: rgb(11 15 14 / 0.55); backdrop-filter: blur(2px); }
        .mo-qa[open] { display: flex; }

        .mo-qa__panel {
          position: fixed;
          left: 0; right: 0; bottom: 0;
          background: #F2EFE8;
          border-radius: 20px 20px 0 0;
          padding: 18px 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          animation: mo-qa-up 320ms cubic-bezier(0.22, 1, 0.36, 1);
          transition: transform 280ms cubic-bezier(0.22, 1, 0.36, 1);
          box-shadow: 0 -8px 40px rgb(11 15 14 / 0.18);
        }
        .mo-qa.is-closing .mo-qa__panel { animation: mo-qa-down 240ms cubic-bezier(0.4, 0, 1, 1) forwards; }

        @media (min-width: 750px) {
          .mo-qa { align-items: center; justify-content: center; }
          .mo-qa__panel {
            position: relative;
            left: auto; right: auto; bottom: auto;
            width: min(480px, 92vw);
            border-radius: 16px;
            animation: mo-qa-fade 240ms cubic-bezier(0.22, 1, 0.36, 1);
            padding: 22px 24px 24px;
          }
        }

        .mo-qa__handle-zone {
          display: flex; justify-content: center; align-items: center;
          height: 22px; margin: -10px 0 -8px;
          touch-action: none;
          cursor: grab;
        }
        .mo-qa__handle {
          width: 44px; height: 4px; border-radius: 2px;
          background: rgb(11 15 14 / 0.2);
        }
        @media (min-width: 750px) { .mo-qa__handle-zone { display: none; } }

        .mo-qa__close {
          position: absolute; top: 14px; right: 16px;
          width: 32px; height: 32px;
          border: 0; background: transparent;
          font-size: 16px; color: #5C6B5A;
          cursor: pointer;
          display: grid; place-items: center;
          border-radius: 999px;
          transition: background 160ms;
        }
        .mo-qa__close:hover { background: rgb(11 15 14 / 0.06); }

        .mo-qa__body { display: flex; gap: 16px; align-items: stretch; }
        .mo-qa__hero {
          flex: 0 0 96px;
          aspect-ratio: 4 / 5;
          overflow: hidden;
          border-radius: 8px;
          background: #eae5dc;
        }
        @media (min-width: 750px) { .mo-qa__hero { flex-basis: 140px; } }

        .mo-qa__copy { display: flex; flex-direction: column; gap: 6px; flex: 1 1 auto; min-width: 0; }
        .mo-qa__eyebrow {
          font-family: var(--font-mono, ui-monospace, monospace);
          font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase;
          color: #5C6B5A;
        }
        .mo-qa__title {
          font-family: var(--font-display, system-ui);
          font-size: 22px; line-height: 1.05; font-weight: 700;
          color: #0B0F0E; margin: 0;
        }
        .mo-qa__price {
          font-family: var(--font-mono, ui-monospace, monospace);
          font-size: 13px; color: #0B0F0E; margin-top: 2px;
        }

        .mo-qa__swatches { display: flex; gap: 6px; margin-top: 10px; flex-wrap: wrap; }
        .mo-qa__swatch {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 10px 6px 6px;
          border-radius: 999px;
          border: 1px solid rgb(11 15 14 / 0.15);
          background: transparent;
          font-family: var(--font-mono, ui-monospace, monospace);
          font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em;
          color: #0B0F0E;
          cursor: pointer;
          transition: border-color 160ms, background 160ms;
        }
        .mo-qa__swatch:hover { border-color: rgb(11 15 14 / 0.45); }
        .mo-qa__swatch.is-active { border-color: #0B0F0E; background: rgb(11 15 14 / 0.04); }
        .mo-qa__swatch-chip {
          width: 16px; height: 16px; border-radius: 999px;
          border: 1px solid rgb(11 15 14 / 0.25);
          display: inline-block;
        }

        .mo-qa__cta {
          width: 100%;
          padding: 14px 20px;
          border: 0;
          border-radius: 8px;
          background: #A8350F;
          color: #F2EFE8;
          font-family: var(--font-mono, ui-monospace, monospace);
          font-size: 12px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 200ms, transform 120ms;
          position: relative;
          overflow: hidden;
        }
        .mo-qa__cta:hover:not(:disabled) { background: #B83C16; }
        .mo-qa__cta:active:not(:disabled) { transform: scale(0.985); }
        .mo-qa__cta:disabled { cursor: default; opacity: 0.95; }
        .mo-qa__cta.is-success { background: #2F5D3A; }
        .mo-qa__cta.is-success::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent, rgb(255 255 255 / 0.18), transparent);
          animation: mo-qa-shine 600ms ease-out;
        }

        @keyframes mo-qa-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes mo-qa-down {
          from { transform: translateY(0); }
          to { transform: translateY(100%); }
        }
        @keyframes mo-qa-fade {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes mo-qa-shine {
          from { transform: translateX(-100%); }
          to { transform: translateX(100%); }
        }

        @media (prefers-reduced-motion: reduce) {
          .mo-qa__panel, .mo-qa__cta { animation: none !important; transition: none !important; }
        }
      `}</style>
    </dialog>
  );
}
