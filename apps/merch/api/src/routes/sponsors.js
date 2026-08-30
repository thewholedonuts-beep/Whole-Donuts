const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query, withTransaction } = require('../config/database');
const { authenticateToken, requireSponsorAccess } = require('../middleware/auth');
const { generateUniqueReferralCode } = require('../utils/referralCode');
const { calculateEffortScore, applyTierDiscountCap } = require('../utils/effortScore');
const { clearSessionCookies, setSessionCookies } = require('../middleware/security');

const router = express.Router();

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').toLowerCase());
}

function sanitizeSponsor(row) {
  if (!row) return null;
  const { password_hash, ...sponsor } = row;
  return sponsor;
}

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, totalContribution = 0 } = req.body;

    if (!name || !isEmail(email) || !password || String(password).length < 8) {
      return res.status(400).json({ error: 'Name, valid email, and a password with at least 8 characters are required.' });
    }

    const sponsor = await withTransaction(async (client) => {
      const existing = await client.query('SELECT id FROM sponsors WHERE email = $1', [email.toLowerCase()]);
      if (existing.rowCount) {
        return null;
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const tempCode = await generateUniqueReferralCode(name.slice(0, 6));
      const contribution = Number(totalContribution) || 0;
      const tierState = applyTierDiscountCap(0, contribution);

      const sponsorInsert = await client.query(
        `INSERT INTO sponsors (name, email, password_hash, referral_code, total_contribution, tier, customization_limit, discount_earned)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [name.trim(), email.toLowerCase(), passwordHash, tempCode, contribution, tierState.tier, tierState.customizationLimit, tierState.discountEarned]
      );

      await client.query(
        `INSERT INTO referral_codes (sponsor_id, code_string)
         VALUES ($1, $2)`,
        [sponsorInsert.rows[0].id, tempCode]
      );

      return sponsorInsert.rows[0];
    });

    if (!sponsor) {
      return res.status(409).json({ error: 'A sponsor with this email already exists.' });
    }

    return res.status(201).json({ sponsor: sanitizeSponsor(sponsor) });
  } catch (error) {
    return next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!isEmail(email) || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const sponsorResult = await query('SELECT * FROM sponsors WHERE email = $1', [email.toLowerCase()]);
    const sponsor = sponsorResult.rows[0];

    if (!sponsor || !(await bcrypt.compare(password, sponsor.password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      {
        sponsorId: sponsor.id,
        email: sponsor.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    setSessionCookies(res, token);
    return res.json({ sponsor: sanitizeSponsor(sponsor) });
  } catch (error) {
    return next(error);
  }
});

router.post('/logout', (_req, res) => {
  clearSessionCookies(res);
  return res.status(204).end();
});

router.get('/:id', authenticateToken, requireSponsorAccess, async (req, res, next) => {
  try {
    const sponsorResult = await query('SELECT * FROM sponsors WHERE id = $1', [req.params.id]);
    if (!sponsorResult.rowCount) {
      return res.status(404).json({ error: 'Sponsor not found.' });
    }

    return res.json({ sponsor: sanitizeSponsor(sponsorResult.rows[0]) });
  } catch (error) {
    return next(error);
  }
});

router.put('/:id', authenticateToken, requireSponsorAccess, async (req, res, next) => {
  try {
    const allowedFields = ['name', 'email'];
    const updates = [];
    const values = [];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = $${updates.length + 1}`);
        values.push(field === 'email' ? String(req.body[field]).toLowerCase() : req.body[field]);
      }
    });

    if (req.body.password) {
      if (String(req.body.password).length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
      }
      updates.push(`password_hash = $${updates.length + 1}`);
      values.push(await bcrypt.hash(req.body.password, 12));
    }

    if (req.body.safety_status !== undefined) {
      const isAdmin = Boolean(req.user?.isOperator);

      if (!isAdmin) {
        return res.status(403).json({ error: 'Only admins can update sponsor safety status.' });
      }

      updates.push(`safety_status = $${updates.length + 1}`);
      values.push(req.body.safety_status);
    }

    if (!updates.length) {
      return res.status(400).json({ error: 'No valid fields provided for update.' });
    }

    values.push(req.params.id);
    const result = await query(
      `UPDATE sponsors SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
      values
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: 'Sponsor not found.' });
    }

    return res.json({ sponsor: sanitizeSponsor(result.rows[0]) });
  } catch (error) {
    return next(error);
  }
});

async function getDashboard(req, res, next) {
  try {
    const sponsorResult = await query('SELECT * FROM sponsors WHERE id = $1', [req.params.id]);
    if (!sponsorResult.rowCount) {
      return res.status(404).json({ error: 'Sponsor not found.' });
    }

    const sponsor = sponsorResult.rows[0];
    const metricsResult = await query(
      `SELECT
         COALESCE(SUM(CASE WHEN event_type = 'click' THEN 1 ELSE 0 END), 0) AS clicks,
         COALESCE(SUM(CASE WHEN event_type = 'share' THEN 1 ELSE 0 END), 0) AS shares,
         COALESCE(SUM(CASE WHEN event_type = 'conversion' THEN 1 ELSE 0 END), 0) AS conversions,
         COALESCE(MAX(rc.usage_count), 0) AS usage_count
       FROM referral_codes rc
       LEFT JOIN referral_events re ON rc.id = re.code_id
       WHERE rc.sponsor_id = $1
       GROUP BY rc.id`,
      [req.params.id]
    );

    const metrics = metricsResult.rows[0] || { clicks: 0, shares: 0, conversions: 0, usage_count: 0 };
    const effort = calculateEffortScore(metrics);
    const tierState = applyTierDiscountCap(effort.discountEarned, sponsor.total_contribution);

    await query(
      `UPDATE sponsors
       SET effort_score = $2,
           discount_earned = $3,
           tier = $4,
           customization_limit = $5,
           updated_at = NOW()
       WHERE id = $1`,
      [req.params.id, effort.effortScore, tierState.discountEarned, tierState.tier, tierState.customizationLimit]
    );

    const ordersResult = await query(
      `SELECT id, customer_name, customer_email, total, fulfillment_status, referral_code_used, created_at
       FROM orders
       WHERE sponsor_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [req.params.id]
    );

    return res.json({
      sponsor: {
        ...sanitizeSponsor({ ...sponsor, effort_score: effort.effortScore, discount_earned: tierState.discountEarned, tier: tierState.tier, customization_limit: tierState.customizationLimit }),
      },
      analytics: {
        clicks: Number(metrics.clicks),
        shares: Number(metrics.shares),
        conversions: Number(metrics.conversions),
        effortScore: effort.effortScore,
        discountEarned: tierState.discountEarned,
      },
      recentOrders: ordersResult.rows,
    });
  } catch (error) {
    return next(error);
  }
}

function attachCurrentSponsor(req, res, next) {
  if (!req.user.sponsorId) {
    return res.status(403).json({ error: 'Sponsor access is required.' });
  }
  req.params.id = req.user.sponsorId;
  return next();
}

router.get('/me/dashboard', authenticateToken, attachCurrentSponsor, requireSponsorAccess, getDashboard);
router.get('/:id/dashboard', authenticateToken, requireSponsorAccess, getDashboard);

module.exports = router;
