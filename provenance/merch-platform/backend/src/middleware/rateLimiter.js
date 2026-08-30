const rateLimit = require('express-rate-limit');

const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 60 * 60 * 1000);
const referralMax = Number(process.env.RATE_LIMIT_MAX_REQUESTS || 1);

const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many API requests. Please try again later.' },
});

const referralValidationLimiter = rateLimit({
  windowMs,
  limit: referralMax,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Referral validation is limited to one attempt per IP per hour.' },
});

module.exports = {
  generalApiLimiter,
  referralValidationLimiter,
};
