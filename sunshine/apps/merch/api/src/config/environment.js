const dotenv = require('dotenv');

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

function parseOrigins(value) {
  const origins = String(value || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins.map((origin) => {
    const parsed = new URL(origin);
    if (isProduction && parsed.protocol !== 'https:') {
      throw new Error(`Production frontend origin must use HTTPS: ${origin}`);
    }
    return parsed.origin;
  });
}

function frontendOrigins() {
  return parseOrigins(process.env.FRONTEND_URLS || process.env.FRONTEND_URL || 'http://localhost:3000');
}

function validateDatabaseEnvironment() {
  if (!isProduction) {
    return;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('Missing required production environment variable: DATABASE_URL');
  }

  if (process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'false' && process.env.DATABASE_ALLOW_INSECURE_TLS !== 'true') {
    throw new Error('Set DATABASE_ALLOW_INSECURE_TLS=true only when explicitly accepting an unverified database certificate.');
  }
}

function validateProductionEnvironment() {
  if (!isProduction) {
    return;
  }

  validateDatabaseEnvironment();

  const required = [
    'JWT_SECRET',
    'IP_HASH_SALT',
    'OPERATOR_API_KEY',
    'FRONTEND_URLS',
    'SHOPIFY_STORE_URL',
    'SHOPIFY_ACCESS_TOKEN',
    'SHOPIFY_WEBHOOK_SECRET',
    'PRINTFUL_API_KEY',
  ];
  const missing = required.filter((name) => !process.env[name]);

  if (missing.length) {
    throw new Error(`Missing required production environment variables: ${missing.join(', ')}`);
  }

  ['JWT_SECRET', 'IP_HASH_SALT', 'OPERATOR_API_KEY'].forEach((name) => {
    if (String(process.env[name]).length < 32) {
      throw new Error(`${name} must be at least 32 characters in production.`);
    }
  });

  frontendOrigins();

  if (!/^[a-z0-9][a-z0-9.-]*\.myshopify\.com$/i.test(process.env.SHOPIFY_STORE_URL)) {
    throw new Error('SHOPIFY_STORE_URL must be a Shopify store hostname without a protocol or path.');
  }
}

function trustProxySetting() {
  const value = process.env.TRUST_PROXY;
  if (value === undefined) {
    return isProduction ? 1 : false;
  }
  if (!/^\d+$/.test(value)) {
    throw new Error('TRUST_PROXY must be a non-negative proxy hop count.');
  }
  return Number(value);
}

module.exports = {
  frontendOrigins,
  isProduction,
  trustProxySetting,
  validateDatabaseEnvironment,
  validateProductionEnvironment,
};
