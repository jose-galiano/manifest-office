/**
 * Programmatic favicon — replaces the placeholder favicon.ico shipped by
 * `create-next-app`. Renders an "M" wordmark on ink with a signal-orange
 * accent dot. Generated at the edge via next/og.
 */

import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = { width: 32, height: 32 } as const;
export const contentType = 'image/png';

export default function Icon(): ImageResponse {
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
        fontWeight: 700,
        fontSize: 22,
        letterSpacing: -1,
        fontFamily: 'sans-serif',
        position: 'relative',
      }}
    >
      M
      <div
        style={{
          position: 'absolute',
          right: 4,
          top: 5,
          width: 5,
          height: 5,
          borderRadius: 999,
          backgroundColor: '#D24A1F',
        }}
      />
    </div>,
    { ...size },
  );
}
