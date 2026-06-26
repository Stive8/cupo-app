const path = require('path');
const { execSync } = require('child_process');
const { Client } = require('pg');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.test'), override: true });

const TABLES_TO_TRUNCATE = [
  'notifications',
  'payments',
  'bookings',
  'availability_slots',
  'services',
  'staff_members',
  'businesses',
  'users',
];

module.exports = async () => {
  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

  const adminClient = new Client({
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    database: 'postgres',
  });
  await adminClient.connect();
  const existing = await adminClient.query('SELECT 1 FROM pg_database WHERE datname = $1', [DB_NAME]);
  if (existing.rowCount === 0) {
    await adminClient.query(`CREATE DATABASE "${DB_NAME}"`);
  }
  await adminClient.end();

  execSync('npm run migration:run', {
    cwd: path.join(__dirname, '..'),
    env: process.env,
    stdio: 'inherit',
  });

  const testClient = new Client({
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
  });
  await testClient.connect();
  await testClient.query(`TRUNCATE TABLE ${TABLES_TO_TRUNCATE.join(', ')} CASCADE`);
  await testClient.end();
};
