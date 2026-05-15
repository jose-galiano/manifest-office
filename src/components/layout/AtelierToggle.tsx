/**
 * Atelier ambient-sound toggle + volume control.
 *
 * Off by default (brand-bible §11: the site is silent unless asked). Once on,
 * the pill expands inline to reveal a volume slider. State, playhead, and
 * volume all persist in `sessionStorage` so navigation between pages resumes
 * cleanly. `prefers-reduced-motion` disables the dot pulse.
 *
 * Implementation notes:
 *  - The `<audio>` element is owned via a `useRef`.
 *  - Fade-in/-out runs as a single rAF interpolation (smoother + cancellable
 *    than a `setInterval` chain).
 *  - Volume drags bypass the fade for immediate response — the fade is only
 *    used for the play/pause transitions.
 *  - We never call `audio.play()` outside a user gesture.
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { ChangeEvent, ReactElement } from 'react';

const SESSION_KEY = 'mo_audio_session';
const POSITION_KEY = 'mo_audio_pos';
const VOLUME_KEY = 'mo_audio_volume';
const AUDIO_SRC = '/audio/atelier.mp3';
const FADE_MS = 1400;
const DEFAULT_VOLUME = 0.18;
const POSITION_FLUSH_INTERVAL_MS = 1000;

// CSS waveform — 5 bars with hand-picked stagger so the cycle doesn't look
// regular. Total cycle ~1100ms; `prefers-reduced-motion` kills the animation
// in the stylesheet below. Cheaper than `AnalyserNode` + canvas redraws; if
// real FFT is ever needed, replace this strip with a `<canvas>` driven by
// the existing `<audio>` element.
const WAVE_BARS: readonly number[] = [0, 240, 480, 120, 360];

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

function readSavedVolume(): number {
  const raw = readSessionStorage(VOLUME_KEY);
  if (raw === null) return DEFAULT_VOLUME;
  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed)) return DEFAULT_VOLUME;
  return Math.max(0, Math.min(1, parsed));
}

export function AtelierToggle(): ReactElement {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeFrameRef = useRef<number | null>(null);
  const [isOn, setIsOn] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(DEFAULT_VOLUME);

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

  useEffect(() => {
    setIsMounted(true);
    setVolume(readSavedVolume());

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
        .then(() => fadeTo(volume, FADE_MS))
        .catch(() => {
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
    // `volume` intentionally not in deps — handled by the slider effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOn, isMounted, fadeTo, flushPosition]);

  useEffect(() => {
    if (!isMounted) return;
    if (readSessionStorage(SESSION_KEY) === '1') setIsOn(true);
  }, [isMounted]);

  const handleToggle = useCallback((): void => {
    setIsOn((previous) => !previous);
  }, []);

  const handleVolumeChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      const next = Math.max(0, Math.min(1, Number.parseFloat(event.target.value)));
      setVolume(next);
      writeSessionStorage(VOLUME_KEY, String(next));
      // Live drag: skip the fade so the slider feels responsive. The fade is
      // only used for the on/off transition.
      const audioElement = audioRef.current;
      if (audioElement && isOn) {
        cancelFade();
        audioElement.volume = next;
      }
    },
    [isOn, cancelFade],
  );

  const volumePercent = Math.round(volume * 100);

  return (
    <div
      data-state={isOn ? 'on' : 'off'}
      className={[
        'group',
        'atelier-toggle',
        'flex h-9 items-center gap-2.5',
        'font-mono text-[11px] tracking-[0.14em] uppercase',
        'select-none text-[var(--color-paper)]',
      ].join(' ')}
    >
      <button
        type="button"
        aria-label={isOn ? 'Pause atelier ambience' : 'Play atelier ambience'}
        aria-pressed={isOn}
        onClick={handleToggle}
        className={[
          'flex items-center gap-2',
          'bg-transparent border-0 p-0',
          'text-inherit cursor-pointer',
          'transition-colors duration-[280ms] ease-out',
          'hover:text-[var(--color-signal)]',
          'data-[state=on]:text-[var(--color-signal)]',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-paper)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F0E]',
        ].join(' ')}
        data-state={isOn ? 'on' : 'off'}
      >
        {/* Play icon (filled triangle) when off · pause-bars when on */}
        <span aria-hidden="true" className="inline-flex h-2.5 w-2.5 items-center justify-center">
          {isOn ? (
            <svg viewBox="0 0 8 8" className="h-2.5 w-2.5 fill-current">
              <rect x="1" y="0.5" width="2" height="7" />
              <rect x="5" y="0.5" width="2" height="7" />
            </svg>
          ) : (
            <svg viewBox="0 0 8 8" className="h-2.5 w-2.5 fill-current">
              <path d="M1.5 0.5 L7 4 L1.5 7.5 Z" />
            </svg>
          )}
        </span>
        {/* Label hidden below `sm` to save horizontal space in the 36px banner
            strip on phones — the icon + waveform carries the affordance. */}
        <span className="hidden sm:inline">♪ ATELIER</span>
      </button>

      {/* Waveform — pure-CSS bars. Only animate when audio is playing
          (data-state="on") so we pay zero CPU while paused. */}
      <span
        aria-hidden="true"
        className="atelier-wave inline-flex items-end gap-[2px] h-3 ml-1"
        data-state={isOn ? 'on' : 'off'}
      >
        {WAVE_BARS.map((delayMs, idx) => (
          <span key={idx} className="atelier-bar" style={{ animationDelay: `${delayMs}ms` }} />
        ))}
      </span>

      {/* Volume — collapsed by default; reveals on hover/focus-within so the
          banner stays Muji-tight unless the user is actually adjusting. */}
      {isOn ? (
        <div
          aria-label="Volume control"
          className={[
            'atelier-volume-wrap',
            'flex items-center overflow-hidden',
            'max-w-0 opacity-0',
            'transition-[max-width,opacity,padding-left] duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
            'group-hover:max-w-[140px] group-hover:opacity-100 group-hover:pl-2',
            'group-focus-within:max-w-[140px] group-focus-within:opacity-100 group-focus-within:pl-2',
          ].join(' ')}
        >
          <div className="flex items-center gap-2 whitespace-nowrap">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={handleVolumeChange}
              aria-label="Atelier ambient volume"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={volumePercent}
              aria-valuetext={`${volumePercent}%`}
              className="atelier-volume w-[80px] cursor-pointer"
              style={{ ['--vol' as string]: `${volumePercent}%` }}
            />
            <span className="w-[22px] text-right text-[10px] tabular-nums tracking-[0.04em] text-[var(--color-paper)]/80">
              {String(volumePercent).padStart(2, '0')}
            </span>
          </div>
        </div>
      ) : null}

      <style>{`
        /* Waveform — 5 vertical bars. Idle (off) is a flat strip of dim
           lichen pips so the affordance hints at audio. Active (on) animates
           each bar's height with offset delays so the cycle reads organic. */
        .atelier-wave .atelier-bar {
          display: block;
          width: 2px;
          height: 3px;
          background: var(--color-lichen);
          border-radius: 1px;
          transition: background 280ms ease;
        }
        .atelier-wave[data-state='on'] .atelier-bar {
          background: var(--color-signal);
          animation: atelier-wave 1100ms ease-in-out infinite;
        }
        @keyframes atelier-wave {
          0%, 100% { height: 3px; }
          25%      { height: 11px; }
          50%      { height: 6px; }
          75%      { height: 13px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .atelier-wave[data-state='on'] .atelier-bar {
            animation: none;
            height: 7px;
          }
        }

        /* Cross-browser styled range. Track is a thin paper-on-ink stripe
           that fills from the left up to the current volume. */
        .atelier-volume {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          height: 14px;
        }
        .atelier-volume:focus-visible {
          outline: 2px solid var(--color-paper);
          outline-offset: 4px;
          border-radius: 9999px;
        }
        .atelier-volume::-webkit-slider-runnable-track {
          height: 2px;
          border-radius: 9999px;
          background: linear-gradient(
            to right,
            var(--color-paper) 0%,
            var(--color-paper) var(--vol, 0%),
            rgb(242 239 232 / 0.28) var(--vol, 0%),
            rgb(242 239 232 / 0.28) 100%
          );
        }
        .atelier-volume::-moz-range-track {
          height: 2px;
          border-radius: 9999px;
          background: rgb(242 239 232 / 0.28);
        }
        .atelier-volume::-moz-range-progress {
          height: 2px;
          border-radius: 9999px;
          background: var(--color-paper);
        }
        .atelier-volume::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 10px;
          height: 10px;
          margin-top: -4px;
          border-radius: 9999px;
          background: var(--color-paper);
          border: 0;
          cursor: pointer;
          transition: transform 160ms ease;
        }
        .atelier-volume::-moz-range-thumb {
          width: 10px;
          height: 10px;
          border-radius: 9999px;
          background: var(--color-paper);
          border: 0;
          cursor: pointer;
          transition: transform 160ms ease;
        }
        .atelier-volume:hover::-webkit-slider-thumb { transform: scale(1.25); }
        .atelier-volume:hover::-moz-range-thumb     { transform: scale(1.25); }
      `}</style>
    </div>
  );
}
