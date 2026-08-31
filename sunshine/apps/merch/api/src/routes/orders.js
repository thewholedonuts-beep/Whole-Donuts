const express = require('express');
const { query, withTransaction } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { normalizeOrderItems } = require('../services/trustedOrder');
const { allowedShopifyTopics, verifyShopifyWebhook } = require('../services/shopifyWebhook');
const { isVerifiedPaidShopifyOrder } = require('../services/trustedOrder');
const { recordVerifiedReferralConversion } = require('../services/referralRewards');

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

async function applyVerifiedReferralAttribution(topic, payload, referralCode, total, integrationEventId) {
  if (!referralCode || !isVerifiedPaidShopifyOrder(topic, payload)) {
    return null;
  }

  return recordVerifiedReferralConversion({
    code: referralCode,
    orderId: String(payload.id),
    total,
    integrationEventId,
  });
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
        `INSERT INTO orders (sponsor_id, shopify_order_id, printful_order_id, customer_name, customer_email, items, subtotal, discount_applied, total, customization_data, referral_code_used)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10::jsonb, $11)
         RETURNING *`,
        [
          sponsorId || null,
          null,
          null,
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

router.post('/webhook/shopify', async (req, res, next) => {
  let eventId;
  try {
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
    const signature = req.get('x-shopify-hmac-sha256');
    const rawBody = req.rawBody;
    const topic = req.get('x-shopify-topic');
    const deliveryId = req.get('x-shopify-webhook-id');

    if (!secret) {
      return res.status(503).json({ error: 'Shopify webhook verification is not configured.' });
    }
    if (!Buffer.isBuffer(rawBody) || !signature || !verifyShopifyWebhook(rawBody, signature, secret)) {
      return res.status(401).json({ error: 'Invalid Shopify webhook signature.' });
    }
    if (!topic || !allowedShopifyTopics().includes(topic)) {
      return res.status(400).json({ error: 'Unsupported Shopify webhook topic.' });
    }
    if (!deliveryId) {
      return res.status(400).json({ error: 'Missing Shopify webhook delivery ID.' });
    }

    const payload = JSON.parse(rawBody.toString('utf8'));
    const claimed = await query(
      `INSERT INTO integration_events (provider, delivery_id, topic, payload, status)
       VALUES ('shopify', $1, $2, $3::jsonb, 'processing')
       ON CONFLICT (provider, delivery_id) DO UPDATE
         SET status = 'processing',
             attempts = integration_events.attempts + 1,
             received_at = NOW(),
             error_message = NULL
       WHERE integration_events.status = 'failed'
          OR integration_events.received_at < NOW() - INTERVAL '5 minutes'
       RETURNING id`,
      [deliveryId, topic, JSON.stringify(payload)]
    );
    if (!claimed.rowCount) {
      return res.status(200).json({ received: true, duplicate: true });
    }
    eventId = claimed.rows[0].id;

    const orderPayload = {
      shopifyOrderId: String(payload.id),
      customerName: [payload.customer?.first_name, payload.customer?.last_name].filter(Boolean).join(' ') || payload.contact_email || 'Shopify Customer',
      customerEmail: payload.email || payload.contact_email || 'unknown@example.com',
      items: (payload.line_items || []).map((item) => ({
        productId: item.sku || item.variant_id,
        quantity: item.quantity,
        unitPrice: Number(item.price || 0),
      })),
      customizationData: {
        source: 'shopify-webhook',
        tags: payload.tags,
      },
      referralCodeUsed: payload.note_attributes?.find?.((attribute) => attribute.name === 'referral_code')?.value || null,
    };

    const existing = await query('SELECT id FROM orders WHERE shopify_order_id = $1', [String(payload.id)]);
    if (existing.rowCount) {
      const update = await query(
        `UPDATE orders
         SET fulfillment_status = $2,
             tracking_number = $3,
             updated_at = NOW()
         WHERE shopify_order_id = $1
         RETURNING *`,
        [String(payload.id), payload.fulfillment_status || 'processing', payload.fulfillments?.[0]?.tracking_number || null]
      );
      const total = Number(payload.total_price || payload.current_total_price || 0);
      const attribution = await applyVerifiedReferralAttribution(
        topic,
        payload,
        orderPayload.referralCodeUsed,
        total,
        eventId
      );
      const order = attribution
        ? await query(
            'UPDATE orders SET sponsor_id = $2, updated_at = NOW() WHERE id = $1 RETURNING *',
            [update.rows[0].id, attribution.sponsorId]
          )
        : update;
      await query('UPDATE integration_events SET status = $2, processed_at = NOW() WHERE id = $1', [eventId, 'processed']);
      return res.json({ order: order.rows[0], synced: true });
    }

    const subtotal = Number(payload.subtotal_price || payload.current_subtotal_price || 0);
    const total = Number(payload.total_price || subtotal);
    const created = await query(
      `INSERT INTO orders (shopify_order_id, customer_name, customer_email, items, subtotal, total, customization_data, fulfillment_status, tracking_number, referral_code_used)
       VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7::jsonb, $8, $9, $10)
       RETURNING *`,
      [
        orderPayload.shopifyOrderId,
        orderPayload.customerName,
        orderPayload.customerEmail.toLowerCase(),
        JSON.stringify(orderPayload.items),
        subtotal,
        total,
        JSON.stringify(orderPayload.customizationData),
        payload.fulfillment_status || 'pending',
        payload.fulfillments?.[0]?.tracking_number || null,
        orderPayload.referralCodeUsed,
      ]
    );

    const attribution = await applyVerifiedReferralAttribution(
      topic,
      payload,
      orderPayload.referralCodeUsed,
      total,
      eventId
    );
    const order = attribution
      ? await query(
          'UPDATE orders SET sponsor_id = $2, updated_at = NOW() WHERE id = $1 RETURNING *',
          [created.rows[0].id, attribution.sponsorId]
        )
      : created;
    await query('UPDATE integration_events SET status = $2, processed_at = NOW() WHERE id = $1', [eventId, 'processed']);
    return res.status(201).json({ order: order.rows[0], synced: true });
  } catch (error) {
    if (eventId) {
      const errorMessage = String(error?.message ?? error).slice(0, 1000);
      await query(
        'UPDATE integration_events SET status = $2, error_message = $3 WHERE id = $1',
        [eventId, 'failed', errorMessage]
      ).catch((updateError) => console.error('Failed to record Shopify webhook error', updateError));
    }
    return next(error);
  }
});

module.exports = router;
