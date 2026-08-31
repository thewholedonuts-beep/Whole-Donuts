const { withTransaction } = require('../config/database');
const { calculateEffortScore, applyTierDiscountCap } = require('../utils/effortScore');

async function recordReferralConversion({ code, orderId, total }) {
  const contribution = Number(total);
  if (!Number.isFinite(contribution) || contribution < 0) {
    throw new Error('Order total is invalid.');
  }

  return withTransaction(async (client) => {
    const codeResult = await client.query(
      `SELECT rc.id, rc.sponsor_id, s.total_contribution
       FROM referral_codes rc
       JOIN sponsors s ON s.id = rc.sponsor_id
       WHERE rc.code_string = $1
         AND rc.status = 'active'
       FOR UPDATE`,
      [code]
    );
    if (!codeResult.rowCount) {
      return null;
    }

    const referralCode = codeResult.rows[0];
    const eventResult = await client.query(
      `INSERT INTO referral_events (code_id, event_type, order_id, metadata, fraud_score, verified_payment)
       VALUES ($1, 'conversion', $2, $3::jsonb, 0, true)
       ON CONFLICT (code_id, order_id) WHERE event_type = 'conversion' AND order_id IS NOT NULL AND verified_payment DO NOTHING
       RETURNING id`,
      [referralCode.id, orderId, JSON.stringify({ source: 'referral-conversion' })]
    );
    if (!eventResult.rowCount) {
      return { sponsorId: referralCode.sponsor_id, recorded: false };
    }

    await client.query(
      `UPDATE referral_codes
       SET usage_count = usage_count + 1,
           conversion_count = conversion_count + 1,
           updated_at = NOW()
       WHERE id = $1`,
      [referralCode.id]
    );

    const metricsResult = await client.query(
      `SELECT
         COALESCE(SUM(CASE WHEN event_type = 'click' THEN 1 ELSE 0 END), 0) AS clicks,
         COALESCE(SUM(CASE WHEN event_type = 'share' THEN 1 ELSE 0 END), 0) AS shares,
         COALESCE(SUM(CASE WHEN event_type = 'conversion' AND verified_payment THEN 1 ELSE 0 END), 0) AS conversions
       FROM referral_events
       WHERE code_id = $1`,
      [referralCode.id]
    );
    const effort = calculateEffortScore(metricsResult.rows[0]);
    const totalContribution = Number(referralCode.total_contribution) + contribution;
    const tierState = applyTierDiscountCap(effort.discountEarned, totalContribution);

    await client.query(
      `UPDATE sponsors
       SET total_contribution = $2,
           effort_score = $3,
           discount_earned = $4,
           tier = $5,
           customization_limit = $6,
           updated_at = NOW()
       WHERE id = $1`,
      [
        referralCode.sponsor_id,
        totalContribution,
        effort.effortScore,
        tierState.discountEarned,
        tierState.tier,
        tierState.customizationLimit,
      ]
    );

    return { sponsorId: referralCode.sponsor_id, recorded: true };
  });
}

module.exports = {
  recordReferralConversion,
};
