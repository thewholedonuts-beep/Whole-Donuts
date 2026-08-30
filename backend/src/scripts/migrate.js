const fs = require('fs/promises');
const path = require('path');
const { pool } = require('../config/database');
const { validateDatabaseEnvironment } = require('../config/environment');

async function runMigrations() {
  validateDatabaseEnvironment();
  const migrationsDirectory = path.resolve(__dirname, '../../../database/migrations');
  const migrationFiles = (await fs.readdir(migrationsDirectory))
    .filter((file) => /^\d+_.+\.sql$/.test(file))
    .sort();
  const client = await pool.connect();

  try {
    await client.query(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
         name VARCHAR(255) PRIMARY KEY,
         applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
       )`
    );

    const alreadyApplied = await client.query('SELECT COUNT(*)::int AS count FROM schema_migrations');
    if (!alreadyApplied.rows[0].count) {
      const initialSchema = await client.query(
        `SELECT to_regclass('public.sponsors') AS sponsors,
                to_regclass('public.referral_codes') AS referral_codes,
                to_regclass('public.referral_events') AS referral_events,
                to_regclass('public.products') AS products,
                to_regclass('public.orders') AS orders,
                to_regclass('public.code_validations') AS code_validations`
      );
      const tables = initialSchema.rows[0];
      if (Object.values(tables).every(Boolean)) {
        await client.query(
          'INSERT INTO schema_migrations (name) VALUES ($1)',
          ['001_initial_schema.sql']
        );
        console.log('Recorded existing initial schema baseline.');
      }
    }

    for (const name of migrationFiles) {
      const applied = await client.query('SELECT 1 FROM schema_migrations WHERE name = $1', [name]);
      if (applied.rowCount) continue;

      const sql = await fs.readFile(path.join(migrationsDirectory, name), 'utf8');
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name]);
        await client.query('COMMIT');
        console.log(`Applied migration ${name}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch((error) => {
  console.error('Database migration failed', error);
  process.exitCode = 1;
});
