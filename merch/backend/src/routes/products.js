const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

function parseArray(value) {
  return Array.isArray(value) ? value : [];
}

function parseObject(value) {
  return value && typeof value === 'object' ? value : {};
}

function calculateCustomizationPrice(product, payload) {
  const baseCost = Number(product.base_cost);
  const markupPercent = Number(product.markup_percent || 20);
  const pricing = product.customization_options || {};
  const logoPlacements = parseArray(payload.logoPlacements);
  const extraText = String(payload.text || '').trim();
  const printMethod = payload.printMethod;

  const logoPlacementFee = logoPlacements.length * Number(pricing.logoPlacementFee || 3);
  const textFee = extraText ? Number(pricing.textFee || Math.min(extraText.length * 0.15, 5)) : 0;
  const printMethodFee = Number((pricing.printMethodFees && pricing.printMethodFees[printMethod]) || {
    embroidery: 8,
    'screen print': 5,
    DTG: 6,
  }[printMethod] || 0);

  const customizationCost = Number((logoPlacementFee + textFee + printMethodFee).toFixed(2));
  const subtotalCost = Number((baseCost + customizationCost).toFixed(2));
  const markupAmount = Number((subtotalCost * (markupPercent / 100)).toFixed(2));
  const finalPrice = Number((subtotalCost + markupAmount).toFixed(2));

  return {
    baseCost,
    customizationCost,
    markupPercent,
    markupAmount,
    finalPrice,
    breakdown: {
      logoPlacementFee,
      textFee,
      printMethodFee,
    },
  };
}

router.get('/', async (req, res, next) => {
  try {
    const conditions = [];
    const values = [];

    if (req.query.category) {
      conditions.push(`category = $${conditions.length + 1}`);
      values.push(req.query.category);
    }

    if (req.query.active !== undefined) {
      conditions.push(`active = $${conditions.length + 1}`);
      values.push(req.query.active === 'true');
    }

    const sql = `SELECT * FROM products ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''} ORDER BY created_at DESC`;
    const result = await query(sql, values);
    return res.json({ products: result.rows });
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (!result.rowCount) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    return res.json({ product: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

router.post('/', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { name, description, baseCost, markupPercent = 20, category, printMethods, availableColors, customizationOptions, shopifyProductId, printfulProductId, inventoryCount = 0, active = true } = req.body;

    if (!name || Number(baseCost) <= 0) {
      return res.status(400).json({ error: 'Product name and baseCost are required.' });
    }

    const result = await query(
      `INSERT INTO products (name, description, base_cost, markup_percent, category, print_methods, available_colors, customization_options, shopify_product_id, printful_product_id, inventory_count, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, $10, $11, $12)
       RETURNING *`,
      [
        name,
        description || null,
        Number(baseCost),
        Number(markupPercent),
        category || null,
        parseArray(printMethods),
        JSON.stringify(parseArray(availableColors)),
        JSON.stringify(parseObject(customizationOptions)),
        shopifyProductId || null,
        printfulProductId || null,
        Number(inventoryCount) || 0,
        Boolean(active),
      ]
    );

    return res.status(201).json({ product: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

router.put('/:id', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const existing = await query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (!existing.rowCount) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const current = existing.rows[0];
    const payload = req.body;
    const result = await query(
      `UPDATE products
       SET name = $2,
           description = $3,
           base_cost = $4,
           markup_percent = $5,
           category = $6,
           print_methods = $7,
           available_colors = $8::jsonb,
           customization_options = $9::jsonb,
           shopify_product_id = $10,
           printful_product_id = $11,
           inventory_count = $12,
           active = $13,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [
        req.params.id,
        payload.name ?? current.name,
        payload.description ?? current.description,
        Number(payload.baseCost ?? current.base_cost),
        Number(payload.markupPercent ?? current.markup_percent),
        payload.category ?? current.category,
        parseArray(payload.printMethods ?? current.print_methods),
        JSON.stringify(payload.availableColors ?? current.available_colors),
        JSON.stringify(payload.customizationOptions ?? current.customization_options),
        payload.shopifyProductId ?? current.shopify_product_id,
        payload.printfulProductId ?? current.printful_product_id,
        Number(payload.inventoryCount ?? current.inventory_count),
        payload.active ?? current.active,
      ]
    );

    return res.json({ product: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

router.post('/:id/customize', async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (!result.rowCount) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const product = result.rows[0];
    const pricing = calculateCustomizationPrice(product, req.body || {});

    return res.json({
      productId: product.id,
      productName: product.name,
      pricing,
      selectedOptions: req.body,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
