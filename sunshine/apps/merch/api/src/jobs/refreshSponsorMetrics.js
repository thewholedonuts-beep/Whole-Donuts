const { pool, query } = require('../config/database');
const { calculateEffortScore, applyTierDiscountCap } = require('../utils/effortScore');
const { validateDatabaseEnvironment } = require('../config/environment');

async function refreshSponsorMetrics() {
  const metrics = await query(
    `SELECT s.id, s.total_contribution,
            COALESCE(MAX(rc.usage_count), 0) AS usage_count,
            COALESCE(SUM(CASE WHEN re.event_type = 'click' THEN 1 ELSE 0 END), 0) AS clicks,
            COALESCE(SUM(CASE WHEN re.event_type = 'share' THEN 1 ELSE 0 END), 0) AS shares,
            COALESCE(SUM(CASE WHEN re.event_type = 'conversion' AND re.verified_payment THEN 1 ELSE 0 END), 0) AS conversions
     FROM sponsors s
     LEFT JOIN referral_codes rc ON rc.sponsor_id = s.id
     LEFT JOIN referral_events re ON re.code_id = rc.id
     GROUP BY s.id`
  );

  for (const row of metrics.rows) {
    const effort = calculateEffortScore(row);
    const tierState = applyTierDiscountCap(effort.discountEarned, row.total_contribution);
    await query(
      `UPDATE sponsors
       SET effort_score = $2,
           discount_earned = $3,
           tier = $4,
           customization_limit = $5,
           updated_at = NOW()
       WHERE id = $1`,
      [row.id, effort.effortScore, tierState.discountEarned, tierState.tier, tierState.customizationLimit]
    );
  }

  return metrics.rowCount;
}

if (require.main === module) {
  validateDatabaseEnvironment();
  refreshSponsorMetrics()
    .then((count) => {
      console.log(`Refreshed sponsor metrics for ${count} sponsors.`);
      return pool.end();
    })
    .catch((error) => {
      console.error('Scheduled sponsor metrics refresh failed', error);
      process.exitCode = 1;
    });
}

module.exports = {
  refreshSponsorMetrics,
};
