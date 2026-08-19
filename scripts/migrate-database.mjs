import { readFile } from 'node:fs/promises';
import dotenv from 'dotenv';
import pg from 'pg';

const envFile = process.env.DATABASE_ENV_FILE?.trim();

if (envFile) {
  dotenv.config({ path: envFile });
} else {
  dotenv.config();
}

const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL_UNPOOLED or DATABASE_URL is required to run migrations.');
}

const schemaPath = new URL('../db/schema.sql', import.meta.url);
const schema = await readFile(schemaPath, 'utf8');
const { Client } = pg;
const client = new Client({
  connectionString,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

try {
  await client.connect();
  await client.query(schema);
  console.log('Database migration completed successfully.');
} finally {
  await client.end();
}
