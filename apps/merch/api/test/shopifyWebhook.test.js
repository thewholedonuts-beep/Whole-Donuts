const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const test = require('node:test');
const { verifyShopifyWebhook } = require('../src/services/shopifyWebhook');

test('accepts a valid Shopify HMAC for the original bytes', () => {
  const secret = 'a test webhook secret';
  const body = Buffer.from('{"id":42,"note":"cafe"}');
  const signature = crypto.createHmac('sha256', secret).update(body).digest('base64');

  assert.equal(verifyShopifyWebhook(body, signature, secret), true);
});

test('rejects a signature generated for different webhook bytes', () => {
  const secret = 'a test webhook secret';
  const body = Buffer.from('{"id":42}');
  const signature = crypto.createHmac('sha256', secret).update(Buffer.from('{"id":43}')).digest('base64');

  assert.equal(verifyShopifyWebhook(body, signature, secret), false);
});
