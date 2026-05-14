# Manifest Office

A fictional DTC brand portfolio piece. The public-repo version of the Manifest Office demo site, rebuilt as a Next.js 15 App Router application with TypeScript and Tailwind 4.

<!-- TODO: add hero shot / screenshot of the live site -->

## Overview

<!-- TODO: write a tight paragraph describing the demo, the original Shopify-themed site, and what this repo demonstrates (architecture, Shopify integration, performance discipline, UI engineering). -->

Live demo: [demo.maelify.com](https://demo.maelify.com)

## Stack

- **Framework**: Next.js 15 (App Router, Turbopack)
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS 4 (with `@theme` directive for design tokens)
- **Runtime**: Node.js 22 LTS
- **Package manager**: pnpm
- **Hosting**: Vercel
- **Integrations**: Shopify Admin API, Klaviyo, Google Gemini

<!-- TODO: link to /docs/architecture.md once filled in -->

## Getting started

```bash
# Install dependencies
pnpm install

# Run dev server (Turbopack)
pnpm dev

# Production build
pnpm build && pnpm start
```

Requires Node 22+. Use `nvm use` to match `.nvmrc`.

<!-- TODO: document required env vars in .env.example -->

## Scripts

| Script              | Purpose                               |
| ------------------- | ------------------------------------- |
| `pnpm dev`          | Start the dev server with Turbopack   |
| `pnpm build`        | Production build                      |
| `pnpm start`        | Run the production build              |
| `pnpm lint`         | Lint with ESLint                      |
| `pnpm lint:fix`     | Lint and auto-fix                     |
| `pnpm typecheck`    | Run the TypeScript compiler in noEmit |
| `pnpm format`       | Format the repo with Prettier         |
| `pnpm format:check` | Verify formatting without writing     |

## Project structure

```
manifest-office/
├── src/
│   ├── app/             # App Router routes
│   ├── components/
│   │   ├── ui/          # Atomic primitives
│   │   ├── layout/      # Shell, nav, footer
│   │   └── sections/    # Page sections
│   ├── lib/
│   │   ├── shopify/     # Admin API client
│   │   ├── klaviyo/     # Event tracking
│   │   ├── gemini/      # Gemini client
│   │   └── security/    # Rate limiting, Turnstile, validation
│   ├── types/           # Shared TS types
│   ├── content/         # Product catalog (single source of truth)
│   └── styles/          # Tokens module
├── public/
│   ├── audio/
│   ├── fonts/
│   └── images/
├── docs/
│   ├── architecture.md
│   └── deployment.md
└── .github/             # CI, issue templates
```

## Deployment

Target: **Vercel**. See [`docs/deployment.md`](./docs/deployment.md).

<!-- TODO: write end-to-end deployment runbook including DNS, env vars, preview/prod flow -->

## License

MIT. See [LICENSE](./LICENSE).

---

Powered by [Maelify.com](https://maelify.com)
