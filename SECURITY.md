# Security Policy

## Reporting a Vulnerability

If you discover a security issue, please email **security@maelify.com** with:

- A clear description of the issue.
- Steps to reproduce, if applicable.
- The commit hash or version where the issue was observed.
- Any suggested mitigations.

Please do **not** open a public GitHub issue for security reports.

We aim to acknowledge reports within 72 hours and to provide a remediation timeline within 7 days.

## Supported Versions

This is a portfolio repository and tracks a single rolling release line. Only the latest commit on `main` receives security updates.

| Version | Supported |
| ------- | --------- |
| `main`  | Yes       |
| Other   | No        |

## Disclosure Policy

- Reporters are credited in release notes unless anonymity is requested.
- We follow coordinated disclosure: once a fix is shipped and deployed to the live demo, details may be made public after a 7-day grace period.

## Out of Scope

- Findings only reproducible on outdated dependencies that have been patched upstream.
- Issues in third-party services (Vercel, Shopify, Klaviyo, Google) — please report those to the respective vendors.
- Theoretical issues without a working proof of concept.
