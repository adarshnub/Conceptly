import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  jsonb,
  pgEnum,
  pgSchema,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const conceptly = pgSchema("conceptly_private");

export const user = conceptly.table("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const session = conceptly.table("session", {
  id: text("id").primaryKey(),
  token: text("token").notNull().unique(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const account = conceptly.table("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", {
    withTimezone: true,
  }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
    withTimezone: true,
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const verification = conceptly.table("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const stepStatus = pgEnum("step_status", [
  "locked",
  "available",
  "completed",
]);

export const tutorStatus = pgEnum("tutor_status", [
  "pending",
  "generated",
  "fallback",
  "failed",
]);

export const profiles = conceptly.table("profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  displayName: text("display_name").notNull(),
  timezone: text("timezone").notNull().default("UTC"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const courses = conceptly.table(
  "courses",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    order: integer("order_index").notNull(),
    isPublished: boolean("is_published").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("courses_slug_idx").on(table.slug)],
);

export const chapters = conceptly.table(
  "chapters",
  {
    id: text("id").primaryKey(),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    prerequisiteChapterId: text("prerequisite_chapter_id"),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    order: integer("order_index").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("chapters_course_slug_idx").on(table.courseId, table.slug),
  ],
);

export const lessonSteps = conceptly.table(
  "lesson_steps",
  {
    id: text("id").primaryKey(),
    chapterId: text("chapter_id")
      .notNull()
      .references(() => chapters.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    kind: text("kind").notNull(),
    title: text("title").notNull(),
    prompt: jsonb("prompt").notNull(),
    privateSolution: jsonb("private_solution").notNull(),
    misconceptionFeedback: jsonb("misconception_feedback").notNull(),
    tutorContext: text("tutor_context").notNull(),
    order: integer("order_index").notNull(),
    xp: integer("xp").notNull().default(10),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("lesson_steps_chapter_slug_idx").on(table.chapterId, table.slug),
  ],
);

export const stepProgress = conceptly.table(
  "step_progress",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    stepId: text("step_id").notNull(),
    status: stepStatus("status").notNull().default("available"),
    attempts: integer("attempts").notNull().default(0),
    firstCompletedAt: timestamp("first_completed_at", { withTimezone: true }),
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.stepId] })],
);

export const stepAttempts = conceptly.table(
  "step_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    stepId: text("step_id").notNull(),
    clientAttemptId: text("client_attempt_id").notNull(),
    submittedAnswer: jsonb("submitted_answer").notNull(),
    isCorrect: boolean("is_correct").notNull(),
    feedbackCode: text("feedback_code").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("step_attempts_user_client_id_idx").on(
      table.userId,
      table.clientAttemptId,
    ),
  ],
);

export const dailyActivity = conceptly.table(
  "daily_activity",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    localDate: date("local_date").notNull(),
    newSteps: integer("new_steps").notNull().default(0),
    chapterCompletions: integer("chapter_completions").notNull().default(0),
    xp: integer("xp").notNull().default(0),
    qualifiesForStreak: boolean("qualifies_for_streak").notNull().default(false),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.localDate] })],
);

export const learningStats = conceptly.table("learning_stats", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  totalXp: integer("total_xp").notNull().default(0),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastQualifyingDate: date("last_qualifying_date"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tutorInterventions = conceptly.table(
  "tutor_interventions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    stepId: text("step_id").notNull(),
    triggeringAttemptId: uuid("triggering_attempt_id").references(
      () => stepAttempts.id,
      { onDelete: "set null" },
    ),
    response: jsonb("response"),
    model: text("model").notNull(),
    promptVersion: text("prompt_version").notNull().default("conceptly-coach-v1"),
    tokenUsage: jsonb("token_usage"),
    status: tutorStatus("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("tutor_step_attempt_idx").on(
      table.userId,
      table.stepId,
      table.triggeringAttemptId,
    ),
  ],
);

export const userRelations = relations(user, ({ one, many }) => ({
  profile: one(profiles),
  sessions: many(session),
}));
