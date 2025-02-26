import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import NodeCache from "node-cache";  // Changed to default import
import dotenv from 'dotenv';
dotenv.config();

neonConfig.webSocketConstructor = ws;

// Ensure DATABASE_URL is present
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL environment variable is required.\nPlease add it to your .env file",
  );
}

// Create cache instance with 5 minutes TTL
export const cache = new NodeCache({ 
  stdTTL: 300,
  checkperiod: 320,
  useClones: false
});

// Optimize pool settings
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 10, // Maximum number of clients
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
};

// Create database connection
export const pool = new Pool(poolConfig);

// Add error handler
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export const db = drizzle(pool, { schema });