# Whole Donuts Sunshine

Canonical unified ecosystem repository for **wenevergonnaclose.com** — consolidating the public site, merch platform, Go ecosystem tools, database migrations, infrastructure, and domain configuration into one production-ready codebase.

## Repository layout

| Area | Purpose |
|---|---|
| `apps/public-site/` | Static public site (GitHub Pages). Entry point at [wenevergonnaclose.com](https://wenevergonnaclose.com/). Includes `CNAME`, World sub-site, Plus-U templates, Supabase migrations, and public auth/storefront configuration. |
| `apps/merch/api/` | Express API for sponsor merchandise operations and integration webhooks (Shopify, Printful). |
| `apps/merch/web/` | Next.js merch dashboard for managing orders, sponsors, and referrals. |
| `apps/universe/` | Go ecosystem tools: domain orchestrator, funnel CLI, analytics dashboard, network and scaling orchestrators, domain config packages, and deployment workflows. |
| `apps/web/` | Main landing page for wenevergonnaclose.com (index.html + assets). |
| `data/postgres/migrations/` | Forward-only PostgreSQL migrations for the merch API. |
| `infra/docker/` | Container build configuration and nginx config. |
| `tools/domain-funnels/` | Offline validation of inactive, sanitized configuration examples only. |
| `Dockerfile` | Multi-stage production container build. |
| `docker-compose.yml` | Local development environment (public site, merch API, Postgres). |
| `.env.example` | Environment variable template — copy to `.env` for local dev. |

## Merged sources

All Whole Donuts repositories have been consolidated here:

| Source repo | Where it landed |
|---|---|
| `thewholedonuts-beep/WHNutz` | `apps/public-site/` |
| `thewholedonuts-beep/wholedonuts-merch-platform` | `apps/merch/` |
| `thewholedonuts-beep/wholedonuts-universe` | `apps/universe/` |
| `thewholedonuts-beep/Whole-Donuts` | `apps/web/` (landing page) |

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for full layout details,
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the production launch guide,
[docs/API.md](docs/API.md) for API documentation, and
[docs/CUTOVER.md](docs/CUTOVER.md) for external launch requirements.
