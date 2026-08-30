const assert = require('node:assert/strict');
const test = require('node:test');
const {
  normalizeOrderItems,
  isVerifiedPaidShopifyOrder,
  newSponsorFinancialDefaults,
} = require('../src/services/trustedOrder');
const { calculateEffortScore } = require('../src/utils/effortScore');

test('order item normalization ignores client unit prices', () => {
  const [item] = normalizeOrderItems([{
    productId: '2aa2e0bc-19ee-4c0e-92c2-3c3b0e694caf',
    quantity: 2,
    unitPrice: 0.01,
  }]);

  assert.deepEqual(item, {
    productId: '2aa2e0bc-19ee-4c0e-92c2-3c3b0e694caf',
    quantity: 2,
    customization: null,
  });
});

test('order item normalization rejects invalid quantities', () => {
  assert.throws(
    () => normalizeOrderItems([{ productId: '2aa2e0bc-19ee-4c0e-92c2-3c3b0e694caf', quantity: -1 }]),
    /positive whole-number quantity/
  );
});

test('only paid Shopify order webhooks can create conversions', () => {
  assert.equal(isVerifiedPaidShopifyOrder('orders/create', { id: 1, financial_status: 'paid' }), true);
  assert.equal(isVerifiedPaidShopifyOrder('orders/updated', { id: 1, financial_status: 'pending' }), false);
  assert.equal(isVerifiedPaidShopifyOrder('fulfillments/create', { id: 1, financial_status: 'paid' }), false);
});

test('new sponsors always receive zero-value financial defaults', () => {
  assert.deepEqual(newSponsorFinancialDefaults(), {
    totalContribution: 0,
    tier: 'bronze',
    customizationLimit: 1,
    discountEarned: 0,
  });

  test('public engagement does not create a referral reward', () => {
    const effort = calculateEffortScore({ clicks: 500, shares: 500, conversions: 0, usageCount: 0 });

    assert.equal(effort.effortScore, 0);
    assert.equal(effort.discountEarned, 0);
  });
});
