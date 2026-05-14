# Contributing

This is a personal portfolio repository. **External pull requests are not accepted.**

Feedback, suggestions, and bug reports are welcome via [GitHub Issues](../../issues). The maintainer reviews issues on a best-effort basis.

## Local development

Requirements:

- Node.js 22 LTS (`nvm use`)
- pnpm 11+

```bash
pnpm install
pnpm dev
```

## Code quality gates

Before any commit, the following must pass locally:

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm build
```

## Commit style

- Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`).
- No `Co-Authored-By` trailers.
- Sign-offs not required but appreciated.

## Code of Conduct

This project follows the [Contributor Covenant v2.1](./CODE_OF_CONDUCT.md).
