const { validateProductionEnvironment } = require('./config/environment');

validateProductionEnvironment();
const app = require('./app');
const { pool } = require('./config/database');

const port = Number(process.env.PORT || 3001);

const server = app.listen(port, () => {
  console.log(`Whole Donuts merch backend listening on port ${port}`);
});

function shutdown(signal) {
  console.log(`Received ${signal}; shutting down.`);
  server.close(() => {
    pool.end()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('Failed to close PostgreSQL pool', error);
        process.exit(1);
      });
  });
}

process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));
