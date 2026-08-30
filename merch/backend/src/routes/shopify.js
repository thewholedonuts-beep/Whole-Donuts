const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

function shopifyHeaders() {
  if (!process.env.SHOPIFY_STORE_URL || !process.env.SHOPIFY_ACCESS_TOKEN) {
    throw new Error('Shopify credentials are not configured.');
  }

  return {
    baseUrl: `https://${process.env.SHOPIFY_STORE_URL}/admin/api/2024-10`,
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN,
    },
  };
}

router.post('/sync-products', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { baseUrl, headers } = shopifyHeaders();
    const response = await fetch(`${baseUrl}/products.json?limit=50`, { headers });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: 'Failed to sync Shopify products.', details: text });
    }

    const data = await response.json();
    const syncedProducts = [];

    for (const product of data.products || []) {
      const baseCost = Number(product.variants?.[0]?.price || 0) / 1.2 || 10;
      const customizationOptions = {
        printMethodFees: {
          embroidery: 8,
          'screen print': 5,
          DTG: 6,
        },
        logoPlacementFee: 3,
        textFee: 2,
      };

      const inventoryCount = (product.variants || []).reduce((sum, variant) => sum + Number(variant.inventory_quantity || 0), 0);
      const existing = await query('SELECT id FROM products WHERE shopify_product_id = $1', [String(product.id)]);
      const params = [
        product.title,
        product.body_html || product.title,
        baseCost,
        product.product_type || 'merch',
        ['embroidery', 'screen print', 'DTG'],
        JSON.stringify((product.options?.[0]?.values || []).map((value) => ({ name: value }))),
        JSON.stringify(customizationOptions),
        String(product.id),
        inventoryCount,
      ];

      const upsert = existing.rowCount
        ? await query(
            `UPDATE products
             SET name = $1,
                 description = $2,
                 base_cost = $3,
                 category = $4,
                 print_methods = $5,
                 available_colors = $6::jsonb,
                 customization_options = $7::jsonb,
                 inventory_count = $9,
                 updated_at = NOW()
             WHERE shopify_product_id = $8
             RETURNING *`,
            params
          )
        : await query(
            `INSERT INTO products (name, description, base_cost, markup_percent, category, print_methods, available_colors, customization_options, shopify_product_id, inventory_count, active)
             VALUES ($1, $2, $3, 20, $4, $5, $6::jsonb, $7::jsonb, $8, $9, true)
             RETURNING *`,
            params
          );
      syncedProducts.push(upsert.rows[0]);
    }

    return res.json({ syncedCount: syncedProducts.length, products: syncedProducts });
  } catch (error) {
    return next(error);
  }
});

router.post('/create-order', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { baseUrl, headers } = shopifyHeaders();
    const response = await fetch(`${baseUrl}/orders.json`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ order: req.body.order || req.body }),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to create Shopify order.', details: data });
    }

    return res.status(201).json({ shopifyOrder: data.order });
  } catch (error) {
    return next(error);
  }
});

router.get('/status', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const configured = Boolean(process.env.SHOPIFY_STORE_URL && process.env.SHOPIFY_ACCESS_TOKEN);
    const productCount = await query('SELECT COUNT(*)::int AS count FROM products WHERE shopify_product_id IS NOT NULL');
    return res.json({
      configured,
      storeUrl: process.env.SHOPIFY_STORE_URL || null,
      syncedProducts: productCount.rows[0].count,
      printfulConfigured: Boolean(process.env.PRINTFUL_API_KEY),
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
