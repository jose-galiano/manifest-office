import type { NextConfig } from 'next';

const IMMUTABLE_CACHE = 'public, max-age=31536000, immutable';

// CSP is permissive on script-src (unsafe-inline + unsafe-eval) because the
// GTM bootstrap, JSON-LD blocks, and Consent Mode default are inline scripts
// without nonces. The connect / frame / img sources are explicit so a hostile
// inline injection can't reach arbitrary endpoints. frame-ancestors 'none'
// blocks click-jacking; X-Frame-Options is left out (deprecated by CSP-3).
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://www.clarity.ms https://*.clarity.ms",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://cdn.shopify.com https://www.google-analytics.com https://www.googletagmanager.com https://*.clarity.ms",
  "font-src 'self' data:",
  "connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com https://region1.google-analytics.com https://www.clarity.ms https://*.clarity.ms https://a.klaviyo.com https://*.klaviyo.com",
  "media-src 'self'",
  "worker-src 'self' blob:",
  "frame-src 'self' https://challenges.cloudflare.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://www.maelify.com",
  'upgrade-insecure-requests',
].join('; ');

const SECURITY_HEADERS: readonly { key: string; value: string }[] = [
  // 2-year HSTS, eligible for preload list. Vercel sets HSTS at the edge by
  // default but emitting from the app makes the header observable in audits.
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  // Send full referrer cross-same-origin, just origin cross-origin downgrade.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Disable MIME-type sniffing.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Lock down browser features we don't use.
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Content-Security-Policy', value: CONTENT_SECURITY_POLICY },
];

const nextConfig: NextConfig = {
  /**
   * Allow `next/image` to optimise Shopify CDN assets. Product galleries and
   * the PLP card stream straight from `cdn.shopify.com`; without this, the
   * Image component fails at runtime with `hostname not configured`.
   */
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.shopify.com' }],
  },

  /**
   * Static-asset caching parity with legacy `vercel.json`.
   * Mood-board imagery and the ambient audio bed are content-hashed by file
   * name (e.g. `v2/maker-cristina.png`) — safe to serve as immutable.
   */
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [...SECURITY_HEADERS],
      },
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
      { source: '/dossiers/:handle', destination: '/products/:handle', permanent: true },
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
