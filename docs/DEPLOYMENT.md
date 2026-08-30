# Deployment Guide — wenevergonnaclose.com

This document describes how to deploy the full Whole Donuts ecosystem.

---

## Prerequisites

- Docker ≥ 24 and Docker Compose ≥ 2.20
- A Supabase project (for auth + database)
- A Shopify store (for merch)
- A Printful account (for print-on-demand fulfillment)
- Domain DNS pointed at your hosting server

---

## Quick Start (local dev)

```bash
# 1. Clone and configure
git clone https://github.com/thewholedonuts-beep/wholedonuts-sunshine
cd wholedonuts-sunshine
cp .env.example .env
# Edit .env with your real credentials

# 2. Start all services
docker compose up --build

# 3. Visit
open http://localhost:8080        # public site
open http://localhost:3001/health # merch API health check
```

---

## Production Deployment

### 1. Configure secrets

Set the following in your hosting provider's secret store (never commit these):

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string with `?sslmode=require` |
| `JWT_SECRET` | Random 32+ char secret for API tokens |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service role key |
| `SHOPIFY_STORE_DOMAIN` | `your-store.myshopify.com` |
| `SHOPIFY_ADMIN_TOKEN` | Shopify Admin API token |
| `SHOPIFY_STOREFRONT_TOKEN` | Shopify Storefront API token |
| `SHOPIFY_WEBHOOK_SECRET` | Shopify webhook signature secret |
| `PRINTFUL_API_KEY` | Printful API token |

### 2. GitHub Pages (public site)

The public site deploys automatically on every push to `main` via the
**Deploy to production** workflow. No manual steps required.

### 3. Merch API

The merch API can be deployed to any Node.js-compatible host. The
`apps/merch/api/Dockerfile` produces a minimal production image:

```bash
docker build -f apps/merch/api/Dockerfile -t wholedonuts-merch-api .
docker run -e DATABASE_URL=... -p 3001:3001 wholedonuts-merch-api
```

### 4. Database migrations

Migrations live in `data/postgres/migrations/` and are numbered sequentially.
Run them in order against your production database:

```bash
psql $DATABASE_URL -f data/postgres/migrations/001_initial_schema.sql
psql $DATABASE_URL -f data/postgres/migrations/002_deployment_readiness.sql
psql $DATABASE_URL -f data/postgres/migrations/003_verified_payment_attribution.sql
```

Supabase migrations (in `apps/public-site/supabase/migrations/`) are applied
via the Supabase dashboard or CLI:

```bash
supabase db push
```

---

## CI/CD Pipeline

| Workflow | Trigger | What it does |
|---|---|---|
| `merch.yml` | PR / push to `main` | Lint + test merch API and frontend |
| `public-site-and-tools.yml` | PR / push to `main` | Syntax-check JS, test Go domain-funnels |
| `universe.yml` | PR / push to `main` | Build + test universe Go CLIs |
| `deploy-pages.yml` | push to `main` | Deploy public site to GitHub Pages |
| `deploy-production.yml` | push to `main` | Full test suite + deploy to production |

---

## Health Checks

- **Public site**: `GET /health` → `200 ok`
- **Merch API**: `GET http://localhost:3001/health` → `200 {"status":"ok"}`

---

## Rollback

To roll back to the previous deployment, revert the offending commit and push:

```bash
git revert HEAD --no-edit
git push
```

GitHub Actions will automatically re-deploy the reverted state.
