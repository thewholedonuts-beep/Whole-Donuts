# Shopify Setup Guide

## 1. Create your Shopify store
1. Sign in to Shopify and create a store for Whole Donuts merch.
2. Choose a plan that includes access to custom apps and webhooks.
3. Confirm your store URL (for example `your-store.myshopify.com`).

## 2. Get API credentials
1. In Shopify Admin, go to **Settings → Apps and sales channels → Develop apps**.
2. Create a custom app for the merch platform.
3. Grant the app access to products, orders, inventory, and fulfillment scopes as needed.
4. Copy the Admin API access token and store URL into `.env`.

## 3. Set up webhooks for orders
1. In the custom app or **Settings → Notifications → Webhooks**, create an order webhook.
2. Point it to `https://your-backend-domain/api/orders/webhook/shopify`.
3. Use `orders/create`, `orders/updated`, and `orders/fulfilled` topics if you want full lifecycle sync.
4. Copy the Shopify webhook secret into `SHOPIFY_WEBHOOK_SECRET`.

## 4. Configure environment variables
Set these values in `backend/.env` or the root `.env` used by your deployment:
- `SHOPIFY_STORE_URL`
- `SHOPIFY_ACCESS_TOKEN`
- `SHOPIFY_WEBHOOK_SECRET`
- `FRONTEND_URL`
- `PRINTFUL_API_KEY`

## 5. Enable a custom storefront if needed
If sponsors or customers should browse outside the Shopify theme:
1. Enable a custom storefront or headless channel in Shopify.
2. Expose product data through the Admin API or Storefront API.
3. Point your frontend to the backend product endpoints for synchronized catalog data.

## 6. Connect Printful for POD fulfillment
1. Create a Printful account and connect it to Shopify.
2. Map Shopify products/variants to Printful templates.
3. Save the Printful API key as `PRINTFUL_API_KEY`.
4. Use the backend Shopify sync endpoints to mirror catalog and order activity into PostgreSQL.
