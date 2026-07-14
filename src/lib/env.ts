import "server-only";

import { z } from "zod";

const optionalUrl = z.string().url().optional().or(z.literal(""));

const envSchema = z.object({
  DATABASE_URL: z.string().url().optional(),
  DATABASE_DIRECT_URL: z.string().url().optional(),
  BETTER_AUTH_SECRET: z.string().min(32).optional(),
  BETTER_AUTH_URL: z.string().url().default("http://localhost:3000"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-5.6-luna"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_URL: optionalUrl,
});

export function getEnv() {
  const parsed = envSchema.safeParse(process.env);
  const isProductionRuntime =
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PHASE !== "phase-production-build";

  if (!parsed.success) {
    if (isProductionRuntime) {
      throw new Error(parsed.error.message);
    }

    return {
      DATABASE_URL: undefined,
      DATABASE_DIRECT_URL: undefined,
      BETTER_AUTH_SECRET:
        "development-only-secret-development-only-secret",
      BETTER_AUTH_URL: "http://localhost:3000",
      OPENAI_API_KEY: undefined,
      OPENAI_MODEL: "gpt-5.6-luna",
      NODE_ENV: "development" as const,
      NEXT_PUBLIC_APP_URL: "",
    };
  }

  if (!parsed.data.BETTER_AUTH_SECRET && isProductionRuntime) {
    throw new Error("BETTER_AUTH_SECRET is required in production.");
  }

  return {
    ...parsed.data,
    BETTER_AUTH_SECRET:
      parsed.data.BETTER_AUTH_SECRET ??
      "development-only-secret-development-only-secret",
  };
}

export function requireDatabaseUrl() {
  const env = getEnv();
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for database-backed requests.");
  }

  return env.DATABASE_URL;
}
