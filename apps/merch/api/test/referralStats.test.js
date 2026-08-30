const assert = require('node:assert/strict');
const test = require('node:test');
const referralRouter = require('../src/routes/referral');

test('referral stats calculates effort from verified conversions', () => {
  const response = referralRouter.buildStatsResponse(
    {
      code_string: 'WHOLE-TEST',
      sponsor_name: 'Whole Donuts',
      tier: 'bronze',
      usage_count: 1,
      unique_clickers: 4,
      safety_flags: [],
      discount_earned: 0.05,
    },
    {
      clicks: 100,
      shares: 20,
      conversions: 2,
      average_fraud_score: 0,
    }
  );

  assert.equal(response.analytics.effortScore, 10);
  assert.equal(response.analytics.discountEarned, 0.05);
  assert.equal(response.conversionCount, 2);
});
