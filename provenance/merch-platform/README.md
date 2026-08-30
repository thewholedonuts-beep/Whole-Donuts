# Whole Donuts Merch Platform

Sponsor merchandise operations built with a Next.js dashboard, Express API, PostgreSQL, Shopify, and Printful fulfillment. Shopify is the checkout and order system of record; PostgreSQL stores Whole Donuts sponsor, referral, and operational data.

## Production architecture

```text
https://merch.example.com       Next.js dashboard
             |
https://merch-api.example.com   Express API, Shopify webhooks, Printful status
             |
           private managed PostgreSQL
```

Deploy the dashboard and API as separate managed HTTPS services on one provider with managed PostgreSQL. The database must remain private to the provider network. Use `docker-compose.production.example.yml` only as a service definition; it intentionally does not provision a database, TLS endpoint, reverse proxy, or secrets.

Read [the deployment guide](docs/DEPLOYMENT.md) before creating a production service. It includes the complete environment-value matrix, release procedure, and rollback steps.

## Local development

1. Copy `.env.example` to `backend/.env` and replace the local database value.
2. Run `npm ci` in both `backend/` and `frontend/`.
3. Create the local PostgreSQL database, then run `npm run migrate` from `backend/`.
4. Start `npm run dev` from both service directories.
5. Open `http://localhost:3000`; the API health endpoint is `http://localhost:3001/health`.

The frontend reads `NEXT_PUBLIC_API_BASE_URL`. It is public build-time configuration, never a secret. The backend reads secrets only from its runtime environment.

## Service commands

| Directory | Command | Purpose |
|---|---|---|
| `backend/` | `npm start` | Run the Express API |
| `backend/` | `npm run migrate` | Apply tracked forward-only migrations |
| `backend/` | `npm run refresh-sponsor-metrics` | Run the scheduled metric refresh once |
| `backend/` | `npm test` | Test webhook HMAC verification |
| `frontend/` | `npm run build` | Build the production dashboard |

Run the metric refresh from one provider scheduler, not from each API instance.

## Commerce integration

- [Shopify setup](docs/SHOPIFY_SETUP.md) covers the custom app, scopes, verified webhook topics, and callback URL.
- [Printful setup](docs/PRINTFUL_SETUP.md) covers the Shopify fulfillment connection and server-side API token.
- `POST /api/orders/webhook/shopify` accepts only configured topics with a valid Shopify HMAC and webhook delivery ID. Replayed deliveries are acknowledged without reprocessing.
- `GET /api/printful/status` is an operator-only connectivity check. Do not expose integration tokens to the frontend.

## Security boundary

Browser sessions use HttpOnly, Secure production cookies; the API enforces CSRF validation for cookie-authenticated mutations. Sponsor access remains scoped to the authenticated sponsor. Operator-only routes require the separate `X-Operator-Key` credential, whose value must be stored in the provider secret manager and sent only by trusted operations tooling.
