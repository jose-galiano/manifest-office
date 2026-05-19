/**
 * Default OG image for every route that doesn't define its own.
 *
 * 1200x630 brand card composed at the edge with `next/og`. Critical for
 * share previews on the homepage, collections, journal, and any future
 * route — without this they fall back to no og:image, which kills CTR on
 * Linkedin, X, iMessage, and most chat clients.
 *
 * Layout: paper backdrop, signal-orange edition stripe down the left,
 * display wordmark + lede + edition meta on the right. Matches the
 * Mismo-discipline restraint we use everywhere else.
 */

import { ImageResponse } from 'next/og';

import { EDITION_01 } from '@/content/manifest-office';

export const runtime = 'edge';

export const size = {
  width: 1200,
  height: 630,
} as const;

export const contentType = 'image/png';

export const alt = 'Manifest Office — Edition 01 · 1,200 systems issued from Porto';

const COLOR_INK = '#0B0F0E';
const COLOR_PAPER = '#F2EFE8';
const COLOR_SIGNAL = '#D24A1F';
const COLOR_LICHEN = '#5C6B5A';

export default function RootOpenGraphImage(): ImageResponse {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        backgroundColor: COLOR_PAPER,
        color: COLOR_INK,
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          width: 96,
          height: '100%',
          backgroundColor: COLOR_SIGNAL,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          paddingBottom: 40,
        }}
      >
        <span
          style={{
            color: COLOR_PAPER,
            fontSize: 14,
            letterSpacing: 6,
            textTransform: 'uppercase',
            transform: 'rotate(-90deg)',
            transformOrigin: 'center',
            whiteSpace: 'nowrap',
          }}
        >
          {`Edition ${EDITION_01.number} · Gibraltar`}
        </span>
      </div>

      <div
        style={{
          flex: 1,
          height: '100%',
          padding: '72px 88px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              fontSize: 18,
              letterSpacing: 6,
              textTransform: 'uppercase',
              color: COLOR_SIGNAL,
              marginBottom: 24,
            }}
          >
            Manifest Office
          </span>
          <span
            style={{
              fontSize: 96,
              fontWeight: 700,
              lineHeight: 0.95,
              letterSpacing: -3,
              color: COLOR_INK,
              maxWidth: 880,
            }}
          >
            A travel kit, locked together.
          </span>
          <span
            style={{
              fontSize: 26,
              lineHeight: 1.35,
              color: COLOR_INK,
              marginTop: 32,
              maxWidth: 760,
            }}
          >
            One field tote. Three tech pouches. Three packing cubes. A machined anchor latch that
            ties them all together.
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span
              style={{
                fontSize: 16,
                letterSpacing: 4,
                textTransform: 'uppercase',
                color: COLOR_LICHEN,
              }}
            >
              1,200 systems issued
            </span>
            <span
              style={{
                fontSize: 16,
                letterSpacing: 4,
                textTransform: 'uppercase',
                color: COLOR_LICHEN,
              }}
            >
              Designed in Gibraltar · Finished in Porto
            </span>
          </div>

          <span
            style={{
              fontSize: 14,
              letterSpacing: 4,
              textTransform: 'uppercase',
              color: COLOR_LICHEN,
            }}
          >
            demo.maelify.com
          </span>
        </div>
      </div>
    </div>,
    { ...size },
  );
}
