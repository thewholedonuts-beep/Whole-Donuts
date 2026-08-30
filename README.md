# Whole Donuts Merch Platform

Whole Donuts Merch Platform is a full-stack e-commerce system for sponsor-managed merchandise, referral tracking, and Shopify/Printful-enabled fulfillment. It combines a Node.js + Express API, PostgreSQL schema, and a Next.js 14 dashboard for sponsor operations.

## Project structure

```text
.
├── backend/                # Express API, sponsor logic, Shopify sync, fraud prevention
├── frontend/               # Next.js 14 + TailwindCSS sponsor dashboard
├── database/               # PostgreSQL SQL migrations
├── docs/                   # Setup guides
├── .env.example            # Shared environment template
├── .gitignore
└── README.md
```

## Architecture

```text
[Next.js Dashboard]
        |
        v
[Express API] ---> [PostgreSQL]
     |   |               |
     |   └--> Referral analytics, sponsors, orders, products
     |
     ├--> Shopify Admin API / Webhooks
     └--> Printful integration hooks
```

## Business model

- **20% markup:** all product pricing is based on `base_cost * 1.20`.
- **Sponsor tiers:**
  - Bronze: $0–$499 contribution, 1 customization/month, max 10% discount
  - Silver: $500–$2499 contribution, 3 customizations/month, max 20% discount
  - Gold: $2500+ contribution, unlimited customization, max 30% discount
- **Referral rewards:**
  - Before 4 uses: `clicks * 0.5 + shares * 1 + conversions * 5`
  - After 4+ uses: conversions only (`conversions * 5`)
  - Discount earned: `min(score * 0.01, 0.30)` with tier-specific caps

## Backend setup

1. Copy the environment file:
   ```bash
   cp .env.example backend/.env
   ```
2. Install dependencies:
   ```bash
   cd backend
   npm install
   ```
3. Configure PostgreSQL and run the migration in `database/migrations/001_initial_schema.sql`.
4. Start the backend:
   ```bash
   npm run dev
   ```
5. Health check:
   ```bash
   curl http://localhost:3001/health
   ```

### Backend API highlights

- `POST /api/sponsors/register` – create sponsor and referral code
- `POST /api/sponsors/login` – sponsor JWT auth
- `GET /api/sponsors/:id/dashboard` – sponsor analytics and recent orders
- `POST /api/referral/validate` – fraud-aware code validation
- `POST /api/referral/event` – click/share/conversion tracking
- `GET /api/products` – product catalog
- `POST /api/orders` – create dashboard order
- `POST /api/orders/webhook/shopify` – Shopify webhook ingestion
- `POST /api/shopify/sync-products` – pull products from Shopify

## Frontend setup

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Set `NEXT_PUBLIC_API_BASE_URL` if the API is not running on `http://localhost:3001/api`.
3. Start the frontend:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:3000`.

## Database setup

1. Create the database:
   ```sql
   CREATE DATABASE wholedonuts_merch;
   ```
2. Enable `pgcrypto` and run the migration:
   ```bash
   psql "$DATABASE_URL" -f database/migrations/001_initial_schema.sql
   ```
3. Seed products or sync from Shopify using `POST /api/shopify/sync-products`.

## Environment variables

- **Database:** `DATABASE_URL`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- **JWT:** `JWT_SECRET`, `JWT_EXPIRES_IN`
- **Shopify:** `SHOPIFY_STORE_URL`, `SHOPIFY_ACCESS_TOKEN`, `SHOPIFY_WEBHOOK_SECRET`
- **Printful:** `PRINTFUL_API_KEY`
- **Security:** `IP_HASH_SALT`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS`, optional `ADMIN_API_KEY`
- **App:** `NODE_ENV`, `PORT`, `FRONTEND_URL`, optional `NEXT_PUBLIC_API_BASE_URL`

## Running the platform

Open two terminals:

```bash
# Terminal 1
cd backend
npm run dev

# Terminal 2
cd frontend
npm run dev
```

Then:
1. Register a sponsor from the landing page.
2. Log in to generate/store a JWT in the browser.
3. Browse products, customize merch, and review recent orders.
4. Use the backend API or Shopify sync endpoints for catalog/order automation.

## Shopify summary

- Create a custom Shopify app with Admin API access.
- Add the order webhook pointing to `/api/orders/webhook/shopify`.
- Store credentials in `.env`.
- Sync products from Shopify into PostgreSQL.
- Connect Shopify to Printful for POD fulfillment.

See `docs/SHOPIFY_SETUP.md` for the full checklist.
