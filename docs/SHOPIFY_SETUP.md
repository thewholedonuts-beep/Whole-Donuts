# Shopify production setup

## Custom app

Create a custom app in the Whole Donuts Shopify store and grant only the scopes required by the enabled workflows:

- `read_products` and `read_inventory` for catalog synchronization.
- `read_orders` for order reconciliation.
- `write_orders` only if trusted operations will use `POST /api/shopify/create-order`.
- Fulfillment scopes only if the app will manage fulfillment directly rather than through Printful's Shopify app.

Record the store hostname without a protocol or path as `SHOPIFY_STORE_URL`, for example `whole-donuts.myshopify.com`. Store the Admin API token only in the Express service's secret manager.

## Webhooks

Configure these callback topics if the corresponding lifecycle updates are needed:

```text
orders/create
orders/updated
fulfillments/create
fulfillments/update
```

Use the production API callback:

```text
https://<api-domain>/api/orders/webhook/shopify
```

Copy the app's webhook signing secret to `SHOPIFY_WEBHOOK_SECRET` in the API secret store and set `SHOPIFY_WEBHOOK_TOPICS` to the exact subscribed topics. The endpoint verifies the HMAC over Shopify's original request bytes, requires `X-Shopify-Webhook-Id`, records each delivery, and safely acknowledges duplicates. Do not place the callback behind a browser login, CDN body rewriting, or a generic rate limit that can drop Shopify retries.

## Release check

1. Deploy and migrate a staging API using its own store/app or safe test data.
2. Confirm `GET /ready` succeeds and that an operator can call the Shopify status endpoint.
3. Register the staging webhook, send a Shopify test event, and confirm one `integration_events` row reaches `processed`.
4. Confirm a repeated delivery does not create a second order or reapply state.
5. Replace the staging callback only after production secrets, DNS, TLS, and the database backup policy are in place.
