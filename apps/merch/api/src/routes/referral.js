const express = require('express');
const { query } = require('../config/database');
const { referralValidationLimiter } = require('../middleware/rateLimiter');
const { hashIp, validateReferralCodeFormat } = require('../utils/referralCode');
const { calculateEffortScore, applyTierDiscountCap } = require('../utils/effortScore');

const router = express.Router();
const botPattern = /(bot|crawl|spider|headless|curl|wget|python|axios)/i;

function parseMetadata(value) {
  return value && typeof value === 'object' ? value : {};
}

async function updateSponsorPerformanceByCode(codeId) {
  const metricsResult = await query(
    `SELECT rc.sponsor_id,
            COALESCE(MAX(rc.usage_count), 0) AS usage_count,
            COALESCE(SUM(CASE WHEN re.event_type = 'click' THEN 1 ELSE 0 END), 0) AS clicks,
            COALESCE(SUM(CASE WHEN re.event_type = 'share' THEN 1 ELSE 0 END), 0) AS shares,
            COALESCE(SUM(CASE WHEN re.event_type = 'conversion' THEN 1 ELSE 0 END), 0) AS conversions,
            COALESCE(MAX(s.total_contribution), 0) AS total_contribution
     FROM referral_codes rc
     JOIN sponsors s ON s.id = rc.sponsor_id
     LEFT JOIN referral_events re ON re.code_id = rc.id
     WHERE rc.id = $1
     GROUP BY rc.sponsor_id`,
    [codeId]
  );

  if (!metricsResult.rowCount) {
    return null;
  }

  const metrics = metricsResult.rows[0];
  const effort = calculateEffortScore(metrics);
  const tierState = applyTierDiscountCap(effort.discountEarned, metrics.total_contribution);

  await query(
    `UPDATE sponsors
     SET effort_score = $2,
         discount_earned = $3,
         tier = $4,
         customization_limit = $5,
         updated_at = NOW()
     WHERE id = $1`,
    [metrics.sponsor_id, effort.effortScore, tierState.discountEarned, tierState.tier, tierState.customizationLimit]
  );

  return {
    ...metrics,
    effortScore: effort.effortScore,
    discountEarned: tierState.discountEarned,
    tier: tierState.tier,
  };
}

router.post('/validate', referralValidationLimiter, async (req, res, next) => {
  try {
    const { code, sponsorId, customerEmail } = req.body;
    const userAgent = req.get('user-agent') || '';
    const ipHash = hashIp(req.ip);

    if (!code || !validateReferralCodeFormat(code)) {
      await query(
        `INSERT INTO code_validations (code_id, attempt_ip_hash, validation_result, reason, action_taken)
         VALUES (NULL, $1, 'fail', 'Invalid code format or checksum.', 'Rejected request')`,
        [ipHash]
      );
      return res.status(400).json({ valid: false, reason: 'Invalid referral code format.' });
    }

    const codeResult = await query(
      `SELECT rc.*, s.id AS sponsor_id, s.referral_code AS sponsor_referral_code, s.safety_status
       FROM referral_codes rc
       JOIN sponsors s ON s.id = rc.sponsor_id
       WHERE rc.code_string = $1`,
      [code]
    );

    if (!codeResult.rowCount) {
      return res.status(404).json({ valid: false, reason: 'Referral code not found.' });
    }

    const referralCode = codeResult.rows[0];
    const reasons = [];
    let result = 'pass';

    if (referralCode.status !== 'active' || referralCode.safety_status === 'blocked') {
      reasons.push('Referral code is not active.');
      result = 'fail';
    }

    if (sponsorId && sponsorId === referralCode.sponsor_id) {
      reasons.push('Sponsors cannot redeem their own referral codes.');
      result = 'fail';
    }

    if (botPattern.test(userAgent)) {
      reasons.push('Suspicious user agent detected.');
      result = 'flagged';
    }

    const dailyLimitResult = await query(
      `SELECT COUNT(*)::int AS attempts
       FROM code_validations
       WHERE code_id = $1
         AND validation_result = 'pass'
         AND attempt_timestamp >= NOW() - INTERVAL '1 day'`,
      [referralCode.id]
    );

    if (dailyLimitResult.rows[0].attempts >= 100) {
      reasons.push('Daily redemption limit reached for this code.');
      result = 'fail';
    }

    const ipReuseResult = await query(
      `SELECT COUNT(*)::int AS attempts
       FROM code_validations
       WHERE attempt_ip_hash = $1
         AND validation_result = 'pass'
         AND attempt_timestamp >= NOW() - INTERVAL '1 hour'`,
      [ipHash]
    );

    if (ipReuseResult.rows[0].attempts >= 1) {
      reasons.push('This IP has already redeemed a code in the last hour.');
      result = 'fail';
    }

    if (customerEmail) {
      const dualInviteResult = await query(
        `SELECT referral_code_used
         FROM orders
         WHERE LOWER(customer_email) = LOWER($1)
           AND referral_code_used IS NOT NULL
         ORDER BY created_at DESC
         LIMIT 1`,
        [customerEmail]
      );

      if (dualInviteResult.rowCount && dualInviteResult.rows[0].referral_code_used !== code) {
        reasons.push('Customer already redeemed a different sponsor code.');
        result = 'flagged';
      }
    }

    if (sponsorId) {
      const loopResult = await query(
        `SELECT 1
         FROM orders
         WHERE sponsor_id = $1
           AND referral_code_used = $2
         LIMIT 1`,
        [referralCode.sponsor_id, code]
      );

      if (loopResult.rowCount) {
        reasons.push('Referral loop detected between sponsors.');
        result = 'flagged';
      }
    }

    const recentFailures = await query(
      `SELECT COUNT(*)::int AS attempts
       FROM code_validations
       WHERE code_id = $1
         AND attempt_ip_hash = $2
         AND validation_result IN ('fail', 'flagged')
         AND attempt_timestamp >= NOW() - INTERVAL '24 hours'`,
      [referralCode.id, ipHash]
    );

    if (recentFailures.rows[0].attempts >= 3 && result === 'pass') {
      reasons.push('Repeated suspicious attempts detected from this IP.');
      result = 'flagged';
    }

    await query(
      `INSERT INTO code_validations (code_id, attempt_ip_hash, validation_result, reason, action_taken)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        referralCode.id,
        ipHash,
        result,
        reasons.join(' ') || 'Validation passed.',
        result === 'pass' ? 'Allow redemption' : 'Hold for review',
      ]
    );

    if (result === 'pass') {
      return res.json({ valid: true, codeId: referralCode.id, sponsorId: referralCode.sponsor_id });
    }

    return res.status(result === 'flagged' ? 403 : 400).json({ valid: false, reason: reasons.join(' '), flagged: result === 'flagged' });
  } catch (error) {
    return next(error);
  }
});

router.post('/event', async (req, res, next) => {
  try {
    const { code, eventType, referrer, orderId, metadata } = req.body;
    const userAgent = req.get('user-agent') || '';
    const ipHash = hashIp(req.ip);

    if (!code || !['click', 'share', 'conversion', 'flagged'].includes(eventType)) {
      return res.status(400).json({ error: 'Valid code and eventType are required.' });
    }

    const codeResult = await query('SELECT * FROM referral_codes WHERE code_string = $1', [code]);
    if (!codeResult.rowCount) {
      return res.status(404).json({ error: 'Referral code not found.' });
    }

    const referralCode = codeResult.rows[0];
    let fraudScore = 0;
    if (botPattern.test(userAgent)) fraudScore += 50;
    if (eventType === 'conversion' && !orderId) fraudScore += 20;

    await query(
      `INSERT INTO referral_events (code_id, event_type, user_ip_hash, referrer, order_id, metadata, fraud_score)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [referralCode.id, eventType, ipHash, referrer || null, orderId || null, JSON.stringify(parseMetadata(metadata)), fraudScore]
    );

    const uniqueClickerResult = await query(
      `SELECT COUNT(DISTINCT user_ip_hash)::int AS count
       FROM referral_events
       WHERE code_id = $1
         AND event_type = 'click'`,
      [referralCode.id]
    );

    await query(
      `UPDATE referral_codes
       SET usage_count = CASE WHEN $2 = 'conversion' THEN usage_count + 1 ELSE usage_count END,
           conversion_count = CASE WHEN $2 = 'conversion' THEN conversion_count + 1 ELSE conversion_count END,
           unique_clickers = $3,
           safety_flags = CASE WHEN $4 > 0 THEN safety_flags || jsonb_build_array('suspicious-activity') ELSE safety_flags END,
           updated_at = NOW()
       WHERE id = $1`,
      [referralCode.id, eventType, uniqueClickerResult.rows[0].count, fraudScore]
    );

    const performance = await updateSponsorPerformanceByCode(referralCode.id);

    return res.status(201).json({
      message: 'Referral event recorded.',
      fraudScore,
      performance,
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/:code/stats', async (req, res, next) => {
  try {
    const code = req.params.code;
    const codeResult = await query(
      `SELECT rc.*, s.name AS sponsor_name, s.tier, s.discount_earned
       FROM referral_codes rc
       JOIN sponsors s ON s.id = rc.sponsor_id
       WHERE rc.code_string = $1`,
      [code]
    );

    if (!codeResult.rowCount) {
      return res.status(404).json({ error: 'Referral code not found.' });
    }

    const statsResult = await query(
      `SELECT
         COALESCE(SUM(CASE WHEN event_type = 'click' THEN 1 ELSE 0 END), 0) AS clicks,
         COALESCE(SUM(CASE WHEN event_type = 'share' THEN 1 ELSE 0 END), 0) AS shares,
         COALESCE(SUM(CASE WHEN event_type = 'conversion' THEN 1 ELSE 0 END), 0) AS conversions,
         COALESCE(AVG(fraud_score), 0) AS average_fraud_score
       FROM referral_events
       WHERE code_id = $1`,
      [codeResult.rows[0].id]
    );

    const effort = calculateEffortScore({
      ...statsResult.rows[0],
      usageCount: codeResult.rows[0].usage_count,
    });

    return res.json({
      code: codeResult.rows[0].code_string,
      sponsor: codeResult.rows[0].sponsor_name,
      tier: codeResult.rows[0].tier,
      usageCount: codeResult.rows[0].usage_count,
      uniqueClickers: codeResult.rows[0].unique_clickers,
      conversionCount: codeResult.rows[0].conversion_count,
      safetyFlags: codeResult.rows[0].safety_flags,
      analytics: {
        clicks: Number(statsResult.rows[0].clicks),
        shares: Number(statsResult.rows[0].shares),
        conversions: Number(statsResult.rows[0].conversions),
        averageFraudScore: Number(statsResult.rows[0].average_fraud_score),
        effortScore: effort.effortScore,
        discountEarned: codeResult.rows[0].discount_earned,
      },
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
