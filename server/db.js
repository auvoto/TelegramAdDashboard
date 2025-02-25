require('dotenv').config();
const { Pool } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-serverless');
const ws = require('ws');
const schema = require('../shared/schema');

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set in .env file",
  );
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema });

module.exports = { pool, db };
