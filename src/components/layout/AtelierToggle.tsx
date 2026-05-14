/**
 * Atelier ambient-sound toggle.
 *
 * Port of `deploy/assets/atelier.js` to React. Off by default. Honours
 * `prefers-reduced-motion` on the pulse animation. Persists state and
 * playback position in `sessionStorage` so navigating between pages
 * resumes the same playhead.
 *
 * Brand-bible §11 says "the site is silent" by default — the toggle is an
 * explicit opt-in override, never an autoplay.
 *
 * Implementation notes:
 *  - The `<audio>` element is owned by React via a `useRef`.
 *  - Fade-in/-out is run as a single `requestAnimationFrame` interpolation,
 *    not a `setInterval` chain (smoother, cancellable, fewer wakeups).
 *  - We never call `audio.play()` outside a user gesture.
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { ReactElement } from 'react';

const SESSION_KEY = 'mo_audio_session';
const POSITION_KEY = 'mo_audio_pos';
const AUDIO_SRC = '/audio/atelier.mp3';
const FADE_MS = 1400;
const TARGET_VOLUME = 0.18;
const POSITION_FLUSH_INTERVAL_MS = 1000;

function readSessionStorage(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSessionStorage(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    /* quota / privacy mode — silently drop. */
  }
}

function readSavedPosition(): number {
  const raw = readSessionStorage(POSITION_KEY);
  if (raw === null) return 0;
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function AtelierToggle(): ReactElement {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeFrameRef = useRef<number | null>(null);
  const [isOn, setIsOn] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Cancel any in-flight fade. Returns the current volume so callers can
  // pick up from where it stopped.
  const cancelFade = useCallback((): void => {
    if (fadeFrameRef.current !== null) {
      cancelAnimationFrame(fadeFrameRef.current);
      fadeFrameRef.current = null;
    }
  }, []);

  const fadeTo = useCallback(
    (target: number, durationMs: number): void => {
      const audioElement = audioRef.current;
      if (!audioElement) return;
      cancelFade();
      const startVolume = audioElement.volume;
      const startTime = performance.now();
      function step(now: number): void {
        if (!audioElement) return;
        const progress = Math.min(1, (now - startTime) / durationMs);
        audioElement.volume = Math.max(
          0,
          Math.min(1, startVolume + (target - startVolume) * progress),
        );
        if (progress < 1) {
          fadeFrameRef.current = requestAnimationFrame(step);
        } else {
          fadeFrameRef.current = null;
        }
      }
      fadeFrameRef.current = requestAnimationFrame(step);
    },
    [cancelFade],
  );

  const flushPosition = useCallback((): void => {
    const audioElement = audioRef.current;
    if (!audioElement) return;
    const currentTime = audioElement.currentTime;
    if (currentTime > 0 && Number.isFinite(currentTime)) {
      writeSessionStorage(POSITION_KEY, String(currentTime));
    }
  }, []);

  // Single mount-time effect: create the <audio> element, restore prior
  // playhead, wire up persistence listeners. We do not autoplay on a fresh
  // tab — only resume within the same session.
  useEffect(() => {
    setIsMounted(true);

    const willResume = readSessionStorage(SESSION_KEY) === '1';

    const audioElement = new Audio();
    audioElement.preload = willResume ? 'auto' : 'none';
    audioElement.loop = true;
    audioElement.src = AUDIO_SRC;
    audioElement.volume = 0;
    audioRef.current = audioElement;

    const onVisibilityChange = (): void => {
      if (document.visibilityState === 'hidden') flushPosition();
    };
    const flushInterval = window.setInterval(flushPosition, POSITION_FLUSH_INTERVAL_MS);
    window.addEventListener('pagehide', flushPosition);
    window.addEventListener('beforeunload', flushPosition);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.clearInterval(flushInterval);
      window.removeEventListener('pagehide', flushPosition);
      window.removeEventListener('beforeunload', flushPosition);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      cancelFade();
      try {
        audioElement.pause();
      } catch {
        /* ignore */
      }
      audioRef.current = null;
    };
  }, [cancelFade, flushPosition]);

  // Reflect store changes onto the audio element. Click handler updates
  // `isOn`; this effect actuates audio + session keys.
  useEffect(() => {
    if (!isMounted) return;
    const audioElement = audioRef.current;
    if (!audioElement) return;

    if (isOn) {
      const saved = readSavedPosition();
      const applySeek = (): void => {
        if (saved <= 0) return;
        const duration = audioElement.duration;
        const safe = Number.isFinite(duration) && duration > 0 ? saved % duration : saved;
        try {
          audioElement.currentTime = safe;
        } catch {
          /* not yet seekable — `loadedmetadata` will retry. */
        }
      };
      if (audioElement.readyState >= 1) {
        applySeek();
      } else {
        audioElement.addEventListener('loadedmetadata', applySeek, { once: true });
      }

      const playPromise = audioElement.play();
      Promise.resolve(playPromise)
        .then(() => fadeTo(TARGET_VOLUME, FADE_MS))
        .catch(() => {
          // Browser blocked autoplay — revert UI silently.
          setIsOn(false);
          writeSessionStorage(SESSION_KEY, '0');
        });
      writeSessionStorage(SESSION_KEY, '1');
    } else {
      flushPosition();
      fadeTo(0, FADE_MS / 2);
      const pauseTimer = window.setTimeout(
        () => {
          try {
            audioElement.pause();
          } catch {
            /* ignore */
          }
        },
        FADE_MS / 2 + 50,
      );
      writeSessionStorage(SESSION_KEY, '0');
      return () => window.clearTimeout(pauseTimer);
    }
  }, [isOn, isMounted, fadeTo, flushPosition]);

  // Restore last session's on/off state. Runs after mount so the audio
  // element exists.
  useEffect(() => {
    if (!isMounted) return;
    if (readSessionStorage(SESSION_KEY) === '1') setIsOn(true);
  }, [isMounted]);

  const handleToggle = useCallback((): void => {
    setIsOn((previous) => !previous);
  }, []);

  return (
    <button
      type="button"
      aria-label="Toggle atelier ambience"
      aria-pressed={isOn}
      onClick={handleToggle}
      data-state={isOn ? 'on' : 'off'}
      className={[
        'atelier-toggle',
        'fixed bottom-[18px] right-[18px] z-[9999]',
        'flex items-center gap-[10px] py-[9px] pl-[11px] pr-[12px]',
        'rounded-none border',
        'font-mono text-[10px] tracking-[0.12em] uppercase',
        'cursor-pointer select-none',
        'transition-[opacity,border-color] duration-[280ms] ease-out',
        'border-[rgb(242_239_232/0.18)] text-[var(--color-paper)]',
        'bg-[rgb(11_15_14/0.86)] backdrop-blur-sm',
        'opacity-[0.62] hover:opacity-100',
        'data-[state=on]:opacity-100 data-[state=on]:border-[rgb(210_74_31/0.55)]',
      ].join(' ')}
    >
      <span aria-hidden="true" className="atelier-dot" data-state={isOn ? 'on' : 'off'} />
      <span>{isOn ? '♪ ATELIER · ON' : '♪ ATELIER'}</span>

      {/*
       * Pulse animation kept inline so the Tailwind 4 build can elide it
       * when unused. `prefers-reduced-motion` disables the keyframes per
       * brand-bible §11.
       */}
      <style>{`
        .atelier-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--color-lichen);
          transition:
            background 280ms ease,
            box-shadow 280ms ease;
        }
        .atelier-dot[data-state='on'] {
          background: var(--color-signal);
          box-shadow: 0 0 8px rgb(210 74 31 / 0.6);
          animation: atelier-pulse 2400ms ease-in-out infinite;
        }
        @keyframes atelier-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @media (prefers-reduced-motion: reduce) {
          .atelier-dot[data-state='on'] { animation: none; }
        }
      `}</style>
    </button>
  );
}
