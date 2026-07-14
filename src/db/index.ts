import "server-only";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { getEnv, requireDatabaseUrl } from "@/lib/env";
import * as schema from "./schema";

const globalForDb = globalThis as typeof globalThis & {
  conceptlyPool?: Pool;
};

function createPool() {
  const env = getEnv();
  const connectionString =
    env.DATABASE_URL ??
    "postgresql://postgres:postgres@127.0.0.1:5432/conceptly";

  return new Pool({
    connectionString,
    max: 5,
    ssl: connectionString.includes("supabase.com")
      ? { rejectUnauthorized: false }
      : undefined,
  });
}

export const pool = globalForDb.conceptlyPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalForDb.conceptlyPool = pool;
}

export const db = drizzle(pool, { schema });

export function assertDatabaseConfigured() {
  requireDatabaseUrl();
}

export * as dbSchema from "./schema";
