const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const crypto = require('crypto');
const sponsorsRouter = require('./routes/sponsors');
const referralRouter = require('./routes/referral');
const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');
const { generalApiLimiter } = require('./middleware/rateLimiter');
const { query } = require('./config/database');
const { frontendOrigins, isProduction, trustProxySetting } = require('./config/environment');
const { csrfProtection, parseCookies, securityHeaders } = require('./middleware/security');

dotenv.config();

const app = express();

app.set('trust proxy', trustProxySetting());
app.use(cors({
  origin(origin, callback) {
    if (!origin || frontendOrigins().includes(origin)) {
      return callback(null, true);
    }
    const error = new Error('Origin is not allowed by CORS.');
    error.statusCode = 403;
    return callback(error);
  },
  credentials: true,
}));
app.use(securityHeaders);
app.use(parseCookies);
app.use(express.json({
  limit: '1mb',
  verify: (req, _res, buffer) => {
    req.rawBody = Buffer.from(buffer);
  },
}));
app.use(express.urlencoded({ extended: true }));
app.use(csrfProtection);
app.use((req, res, next) => {
  req.requestId = crypto.randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  next();
});
app.use((req, res, next) => {
  return generalApiLimiter(req, res, next);
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/ready', async (_req, res, next) => {
  try {
    await query('SELECT 1');
    return res.json({ status: 'ready' });
  } catch (error) {
    return next(error);
  }
});

app.use('/api/sponsors', sponsorsRouter);
app.use('/api/referral', referralRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);

app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use((error, req, res, _next) => {
  console.error(JSON.stringify({
    requestId: req.requestId,
    message: error.message,
    stack: isProduction ? undefined : error.stack,
  }));
  const status = error.statusCode || 500;
  res.status(status).json({
    error: status >= 500 && isProduction ? 'Internal server error' : (error.message || 'Internal server error'),
    requestId: req.requestId,
  });
});

module.exports = app;
