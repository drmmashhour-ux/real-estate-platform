const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString || !String(connectionString).trim()) {
  console.error('Set DATABASE_URL (e.g. from apps/web/.env.local) before running this script.');
  process.exit(1);
}

const client = new Client({
  connectionString,
});

async function test() {
  try {
    await client.connect();
    console.log('Connected successfully');
    const res = await client.query('SELECT 1 as result');
    console.log('Query result:', res.rows[0]);
    await client.end();
  } catch (err) {
    console.error('Connection error:', err.message);
    process.exit(1);
  }
}

test();
