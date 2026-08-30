const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const dotenv = require('dotenv');
const sponsorsRouter = require('./routes/sponsors');
const referralRouter = require('./routes/referral');
const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');
const shopifyRouter = require('./routes/shopify');
const { generalApiLimiter } = require('./middleware/rateLimiter');
const { query } = require('./config/database');
const { calculateEffortScore, applyTierDiscountCap } = require('./utils/effortScore');

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({
  limit: '1mb',
  verify: (req, _res, buffer) => {
    req.rawBody = buffer.toString();
  },
}));
app.use(express.urlencoded({ extended: true }));
app.use(generalApiLimiter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/sponsors', sponsorsRouter);
app.use('/api/referral', referralRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/shopify', shopifyRouter);

if (process.env.DISABLE_CRON !== 'true') {
  cron.schedule('0 * * * *', async () => {
    try {
      const metrics = await query(
        `SELECT s.id, s.total_contribution,
                COALESCE(MAX(rc.usage_count), 0) AS usage_count,
                COALESCE(SUM(CASE WHEN re.event_type = 'click' THEN 1 ELSE 0 END), 0) AS clicks,
                COALESCE(SUM(CASE WHEN re.event_type = 'share' THEN 1 ELSE 0 END), 0) AS shares,
                COALESCE(SUM(CASE WHEN re.event_type = 'conversion' THEN 1 ELSE 0 END), 0) AS conversions
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
    } catch (error) {
      console.error('Scheduled sponsor metrics refresh failed', error);
    }
  });
}

app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  const status = error.statusCode || 500;
  res.status(status).json({
    error: error.message || 'Internal server error',
  });
});

module.exports = app;
