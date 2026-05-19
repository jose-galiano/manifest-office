/**
 * Apple touch icon (180×180). Without this, iOS Safari renders a tiny
 * cropped screenshot of the homepage when a visitor adds the site to their
 * home screen — visually identical to every other Shopify storefront.
 *
 * Same wordmark + signal accent as the favicon, scaled up with room to
 * breathe on a rounded-rect background.
 */

import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = { width: 180, height: 180 } as const;
export const contentType = 'image/png';

export default function AppleIcon(): ImageResponse {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0B0F0E',
        color: '#F2EFE8',
        fontFamily: 'sans-serif',
        position: 'relative',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: 110,
          letterSpacing: -4,
          lineHeight: 1,
        }}
      >
        M
      </div>
      <div
        style={{
          position: 'absolute',
          right: 36,
          top: 36,
          width: 18,
          height: 18,
          borderRadius: 999,
          backgroundColor: '#D24A1F',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 18,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: 10,
          letterSpacing: 4,
          textTransform: 'uppercase',
          color: '#5C6B5A',
        }}
      >
        Manifest
      </div>
    </div>,
    { ...size },
  );
}
