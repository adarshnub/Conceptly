import "server-only";

import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { getEnv } from "@/lib/env";

const env = getEnv();
const week = 60 * 60 * 24 * 7;

export const auth = betterAuth({
  appName: "Conceptly",
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
    transaction: true,
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: week,
    updateAge: 60 * 60 * 24,
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 12,
  },
  databaseHooks: {
    user: {
      create: {
        after: async (createdUser) => {
          await db
            .insert(schema.profiles)
            .values({
              userId: createdUser.id,
              displayName: createdUser.name || createdUser.email.split("@")[0],
              timezone: "UTC",
            })
            .onConflictDoNothing();

          await db
            .insert(schema.learningStats)
            .values({ userId: createdUser.id })
            .onConflictDoNothing();
        },
      },
    },
  },
  plugins: [nextCookies()],
});

export type AuthSession = typeof auth.$Infer.Session;
