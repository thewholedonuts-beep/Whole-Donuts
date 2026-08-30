# API Reference

This document describes the HTTP APIs exposed by the Whole Donuts ecosystem.

---

## Merch API

**Base URL (production):** `https://api.wenevergonnaclose.com/api`  
**Base URL (local dev):** `http://localhost:3001/api`

All authenticated endpoints require a `Bearer` JWT in the `Authorization` header.

---

### Health

```
GET /health
```

Returns `200 {"status":"ok"}` when the API is up. No auth required.

---

### Products

```
GET /api/products
```

Returns the list of available merch products from Shopify.

**Response:**
```json
[
  {
    "id": "gid://shopify/Product/123",
    "title": "Whole DoNuts Tee",
    "variants": [...],
    "images": [...]
  }
]
```

---

### Orders

```
POST /api/orders
Authorization: ******
Content-Type: application/json

{
  "variantId": "gid://shopify/ProductVariant/456",
  "quantity": 1,
  "referralCode": "CRUMB-ABC"
}
```

Creates an order and triggers Printful fulfillment.

---

### Referrals

```
POST /api/referral/generate
Authorization: ******
```

Generates a unique referral code for the authenticated user.

```
GET /api/referral/:code/stats
Authorization: ******
```

Returns conversion stats for a referral code.

---

### Sponsors

```
GET /api/sponsors
```

Lists active sponsor tiers and perks.

```
POST /api/sponsors/apply
Authorization: ******
Content-Type: application/json

{
  "tier": "gold",
  "message": "Optional message"
}
```

---

### Shopify Webhooks

```
POST /api/shopify/webhook
X-Shopify-Hmac-Sha256: <signature>
```

Internal endpoint for Shopify event ingestion (orders, fulfillments).
Requests are verified against `SHOPIFY_WEBHOOK_SECRET`.

---

## Supabase / Auth

Authentication is handled by Supabase Auth. The public site uses the
Supabase JS client directly for sign-up, sign-in, and session management.

See `apps/public-site/auth-config.js` and `apps/public-site/auth.js` for
the client-side auth configuration.

---

## Universe CLIs

The universe tools are Go binaries available after building with `make` in
`apps/universe/`.

| Binary | Description |
|---|---|
| `funnel-cli` | Manage domain funnels |
| `funnel-deploy` | Deploy funnel configurations |
| `analytics-dashboard` | Display funnel analytics |
| `network-orchestrator` | Orchestrate multi-domain network |
| `scaling-orchestrator` | Auto-scale domain resources |

Run any binary with `--help` for usage details.
