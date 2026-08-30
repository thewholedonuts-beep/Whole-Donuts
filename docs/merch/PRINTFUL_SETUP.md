# Printful fulfillment setup

Connect Printful to the same Shopify store so Shopify remains the checkout and order record while Printful handles product fulfillment. Map every Shopify product/variant to its Printful template before opening customer checkout.

The API's `PRINTFUL_API_KEY` is server-side only. It supports the protected `GET /api/printful/status` connectivity check and is reserved for future direct reconciliation workflows; it must not be sent to the Next.js application or placed in `NEXT_PUBLIC_*` configuration.

Before launch:

1. Select the intended Printful account and store.
2. Create a least-privilege API token suitable for the enabled catalog/order workflow.
3. Store the token only in the API secret manager as `PRINTFUL_API_KEY`.
4. Verify the status endpoint with the trusted operator credential.
5. Place a staging/test order through Shopify and confirm its mapped Printful fulfillment updates return to Shopify, then through the verified Shopify webhook to the API.

If direct Printful callbacks are enabled later, add their documented authentication/verification mechanism before exposing a callback URL. Do not reuse the Shopify signing secret.
