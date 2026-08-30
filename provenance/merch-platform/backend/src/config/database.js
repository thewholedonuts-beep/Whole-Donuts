const { Pool } = require('pg');
const { isProduction } = require('./environment');

const connectionString = process.env.DATABASE_URL;

function sslConfig() {
  if (!isProduction) {
    return false;
  }

  const rejectUnauthorized = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false';
  const ca = process.env.DATABASE_SSL_CA?.replace(/\\n/g, '\n');
  return ca ? { rejectUnauthorized, ca } : { rejectUnauthorized };
}

const pool = new Pool(
  connectionString
    ? {
        connectionString,
        max: Number(process.env.DATABASE_POOL_MAX || 10),
        idleTimeoutMillis: Number(process.env.DATABASE_IDLE_TIMEOUT_MS || 30000),
        connectionTimeoutMillis: Number(process.env.DATABASE_CONNECT_TIMEOUT_MS || 5000),
        ssl: sslConfig(),
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 5432),
        database: process.env.DB_NAME || 'wholedonuts_merch',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        ssl: sslConfig(),
      }
);

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error', error);
});

async function query(text, params = []) {
  return pool.query(text, params);
}

async function withTransaction(work) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  query,
  withTransaction,
};
