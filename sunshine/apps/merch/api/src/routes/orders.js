const express = require('express');
const { query, withTransaction } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { normalizeOrderItems } = require('../services/trustedOrder');

const router = express.Router();

async function calculateTotals(items, discountApplied) {
  const productIds = [...new Set(items.map((item) => item.productId))];
  const productResult = await query('SELECT id, name, final_price, base_cost, markup_percent FROM products WHERE id = ANY($1::uuid[])', [productIds]);
  const priceMap = new Map(productResult.rows.map((row) => [row.id, row]));

  let subtotal = 0;
  const normalizedItems = items.map((item) => {
    const product = priceMap.get(item.productId);
    if (!product) {
      throw new Error(`Product ${item.productId} not found.`);
    }
    const unitPrice = Number(product.final_price);
    const lineTotal = unitPrice * item.quantity;
    subtotal += lineTotal;
    return {
      ...item,
      productName: product.name,
      unitPrice: Number(unitPrice.toFixed(2)),
      lineTotal: Number(lineTotal.toFixed(2)),
    };
  });

  const total = Math.max(subtotal - subtotal * (Number(discountApplied) || 0), 0);
  return {
    subtotal: Number(subtotal.toFixed(2)),
    total: Number(total.toFixed(2)),
    items: normalizedItems,
  };
}

router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { sponsorId, customerName, customerEmail, items, customizationData = {} } = req.body;
    if (!customerName || !customerEmail) {
      return res.status(400).json({ error: 'Customer name and email are required.' });
    }

    if (sponsorId && !req.user.isOperator && sponsorId !== req.user.sponsorId) {
      return res.status(403).json({ error: 'You do not have access to create orders for this sponsor.' });
    }

    const normalizedItems = normalizeOrderItems(items);
    let discountApplied = 0;

    if (sponsorId) {
      const sponsorResult = await query('SELECT discount_earned FROM sponsors WHERE id = $1', [sponsorId]);
      if (sponsorResult.rowCount) {
        discountApplied = Number(sponsorResult.rows[0].discount_earned || 0);
      }
    }

    const totals = await calculateTotals(normalizedItems, discountApplied);

    const order = await withTransaction(async (client) => {
      const insertResult = await client.query(
        `INSERT INTO orders (sponsor_id, customer_name, customer_email, items, subtotal, discount_applied, total, customization_data, referral_code_used)
         VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8::jsonb, $9)
         RETURNING *`,
        [
          sponsorId || null,
          customerName,
          customerEmail.toLowerCase(),
          JSON.stringify(totals.items),
          totals.subtotal,
          discountApplied,
          totals.total,
          JSON.stringify({ ...customizationData, source: 'unverified-dashboard-order' }),
          null,
        ]
      );

      return insertResult.rows[0];
    });

    return res.status(201).json({ order });
  } catch (error) {
    if (error.message.includes('required') || error.message.includes('not found')) {
      return res.status(400).json({ error: error.message });
    }
    return next(error);
  }
});

router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    if (!result.rowCount) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (!req.user.isOperator && result.rows[0].sponsor_id !== req.user.sponsorId) {
      return res.status(403).json({ error: 'You do not have access to this order.' });
    }

    return res.json({ order: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

router.put('/:id/status', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { fulfillmentStatus, trackingNumber } = req.body;
    const allowed = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

    if (!allowed.includes(fulfillmentStatus)) {
      return res.status(400).json({ error: 'Invalid fulfillment status.' });
    }

    const result = await query(
      `UPDATE orders
       SET fulfillment_status = $2,
           tracking_number = $3,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [req.params.id, fulfillmentStatus, trackingNumber || null]
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    return res.json({ order: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const conditions = [];
    const values = [];

    if (req.query.sponsorId) {
      conditions.push(`sponsor_id = $${conditions.length + 1}`);
      values.push(req.query.sponsorId);
    }

    if (req.query.status) {
      conditions.push(`fulfillment_status = $${conditions.length + 1}`);
      values.push(req.query.status);
    }

    if (!req.user.isOperator) {
      conditions.push(`sponsor_id = $${conditions.length + 1}`);
      values.push(req.user.sponsorId);
    }

    const sql = `SELECT * FROM orders ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''} ORDER BY created_at DESC`;
    const result = await query(sql, values);
    return res.json({ orders: result.rows });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
