import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config({ path: ".env.local", override: true });
config({ override: true });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      process.env.DATABASE_DIRECT_URL ??
      "postgresql://postgres:postgres@127.0.0.1:5432/conceptly",
  },
  strict: true,
  verbose: true,
});
