// Native Next.js `robots.ts` convention. Emits `/robots.txt` from a typed
// `MetadataRoute.Robots` shape. The policy here is deliberately AI-permissive:
// the storefront's whole point is to be ingested by agentic shopping clients.

import { SITE_ORIGIN } from '@/lib/seo';

import type { MetadataRoute } from 'next';

// AI / LLM crawlers we explicitly invite. Some sites block these — we want
// the opposite. Listing them as their own rules makes the intent unambiguous
// (and survives any future tightening of the catch-all `*` policy).
const AI_USER_AGENTS = [
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'ClaudeBot',
  'anthropic-ai',
  'Claude-Web',
  'Google-Extended',
  'PerplexityBot',
  'Applebot-Extended',
  'Amazonbot',
  'meta-externalagent',
  'Bytespider',
] as const;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // `/api/*` is the server's command surface (reserve, desk, track).
        // Only `/api/products` is a catalogue feed crawlers should ingest.
        disallow: ['/api/'],
      },
      {
        userAgent: '*',
        allow: ['/api/products'],
      },
      ...AI_USER_AGENTS.map((agent) => ({
        userAgent: agent,
        allow: ['/', '/api/products', '/llms.txt', '/llms-full.txt'],
        disallow: ['/api/reserve', '/api/desk', '/api/track', '/api/config'],
      })),
    ],
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
    host: SITE_ORIGIN,
  };
}
