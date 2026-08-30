const crypto = require('crypto');

function verifyShopifyWebhook(rawBody, signature, secret) {
  if (!Buffer.isBuffer(rawBody) || !signature || !secret) {
    return false;
  }

  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest();
  const received = Buffer.from(signature, 'base64');
  return received.length === expected.length && crypto.timingSafeEqual(received, expected);
}

function allowedShopifyTopics() {
  return String(
    process.env.SHOPIFY_WEBHOOK_TOPICS || 'orders/create,orders/updated,fulfillments/create,fulfillments/update'
  )
    .split(',')
    .map((topic) => topic.trim())
    .filter(Boolean);
}

module.exports = {
  allowedShopifyTopics,
  verifyShopifyWebhook,
};
