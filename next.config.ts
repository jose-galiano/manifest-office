import type { NextConfig } from 'next';

const IMMUTABLE_CACHE = 'public, max-age=31536000, immutable';

const nextConfig: NextConfig = {
  /**
   * Allow `next/image` to optimise Shopify CDN assets. Product galleries and
   * the PLP card stream straight from `cdn.shopify.com`; without this, the
   * Image component fails at runtime with `hostname not configured`.
   */
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.shopify.com' },
    ],
  },

  /**
   * Static-asset caching parity with legacy `vercel.json`.
   * Mood-board imagery and the ambient audio bed are content-hashed by file
   * name (e.g. `v2/maker-cristina.png`) — safe to serve as immutable.
   */
  async headers() {
    return [
      {
        source: '/images/:path*',
        headers: [{ key: 'Cache-Control', value: IMMUTABLE_CACHE }],
      },
      {
        source: '/audio/:path*',
        headers: [{ key: 'Cache-Control', value: IMMUTABLE_CACHE }],
      },
    ];
  },

  /**
   * Legacy URLs → canonical Shopify routes (`docs/routing.md`). The
   * `permanent: true` 301s are deliberate: they are SEO-critical because
   * the demo has been live at the legacy paths.
   */
  async redirects() {
    return [
      { source: '/dossiers', destination: '/collections/edition-01', permanent: true },
      { source: '/dossiers/:handle', destination: '/products/manifest-:handle', permanent: true },
      { source: '/pdp', destination: '/collections/edition-01', permanent: true },
      { source: '/collection', destination: '/collections/all', permanent: true },
      { source: '/editions', destination: '/pages/editions', permanent: true },
      { source: '/editions/01', destination: '/collections/edition-01', permanent: true },
      { source: '/system', destination: '/pages/system', permanent: true },
      { source: '/provenance', destination: '/pages/provenance', permanent: true },
    ];
  },
};

export default nextConfig;
