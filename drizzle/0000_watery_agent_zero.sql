CREATE SCHEMA "conceptly_private";
--> statement-breakpoint
CREATE TYPE "public"."step_status" AS ENUM('locked', 'available', 'completed');--> statement-breakpoint
CREATE TYPE "public"."tutor_status" AS ENUM('pending', 'generated', 'fallback', 'failed');--> statement-breakpoint
CREATE TABLE "conceptly_private"."account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conceptly_private"."chapters" (
	"id" text PRIMARY KEY NOT NULL,
	"course_id" text NOT NULL,
	"prerequisite_chapter_id" text,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"order_index" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conceptly_private"."courses" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"order_index" integer NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conceptly_private"."daily_activity" (
	"user_id" text NOT NULL,
	"local_date" date NOT NULL,
	"new_steps" integer DEFAULT 0 NOT NULL,
	"chapter_completions" integer DEFAULT 0 NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"qualifies_for_streak" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_activity_user_id_local_date_pk" PRIMARY KEY("user_id","local_date")
);
--> statement-breakpoint
CREATE TABLE "conceptly_private"."learning_stats" (
	"user_id" text PRIMARY KEY NOT NULL,
	"total_xp" integer DEFAULT 0 NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"last_qualifying_date" date,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conceptly_private"."lesson_steps" (
	"id" text PRIMARY KEY NOT NULL,
	"chapter_id" text NOT NULL,
	"slug" text NOT NULL,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"prompt" jsonb NOT NULL,
	"private_solution" jsonb NOT NULL,
	"misconception_feedback" jsonb NOT NULL,
	"tutor_context" text NOT NULL,
	"order_index" integer NOT NULL,
	"xp" integer DEFAULT 10 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conceptly_private"."profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conceptly_private"."session" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "conceptly_private"."step_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"step_id" text NOT NULL,
	"client_attempt_id" text NOT NULL,
	"submitted_answer" jsonb NOT NULL,
	"is_correct" boolean NOT NULL,
	"feedback_code" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conceptly_private"."step_progress" (
	"user_id" text NOT NULL,
	"step_id" text NOT NULL,
	"status" "step_status" DEFAULT 'available' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"first_completed_at" timestamp with time zone,
	"last_activity_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "step_progress_user_id_step_id_pk" PRIMARY KEY("user_id","step_id")
);
--> statement-breakpoint
CREATE TABLE "conceptly_private"."tutor_interventions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"step_id" text NOT NULL,
	"triggering_attempt_id" uuid,
	"response" jsonb,
	"model" text NOT NULL,
	"prompt_version" text DEFAULT 'conceptly-coach-v1' NOT NULL,
	"token_usage" jsonb,
	"status" "tutor_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conceptly_private"."user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "conceptly_private"."verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "conceptly_private"."account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "conceptly_private"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conceptly_private"."chapters" ADD CONSTRAINT "chapters_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "conceptly_private"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conceptly_private"."daily_activity" ADD CONSTRAINT "daily_activity_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "conceptly_private"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conceptly_private"."learning_stats" ADD CONSTRAINT "learning_stats_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "conceptly_private"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conceptly_private"."lesson_steps" ADD CONSTRAINT "lesson_steps_chapter_id_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "conceptly_private"."chapters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conceptly_private"."profiles" ADD CONSTRAINT "profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "conceptly_private"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conceptly_private"."session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "conceptly_private"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conceptly_private"."step_attempts" ADD CONSTRAINT "step_attempts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "conceptly_private"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conceptly_private"."step_progress" ADD CONSTRAINT "step_progress_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "conceptly_private"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conceptly_private"."tutor_interventions" ADD CONSTRAINT "tutor_interventions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "conceptly_private"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conceptly_private"."tutor_interventions" ADD CONSTRAINT "tutor_interventions_triggering_attempt_id_step_attempts_id_fk" FOREIGN KEY ("triggering_attempt_id") REFERENCES "conceptly_private"."step_attempts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "chapters_course_slug_idx" ON "conceptly_private"."chapters" USING btree ("course_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "courses_slug_idx" ON "conceptly_private"."courses" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "lesson_steps_chapter_slug_idx" ON "conceptly_private"."lesson_steps" USING btree ("chapter_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "step_attempts_user_client_id_idx" ON "conceptly_private"."step_attempts" USING btree ("user_id","client_attempt_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tutor_step_attempt_idx" ON "conceptly_private"."tutor_interventions" USING btree ("user_id","step_id","triggering_attempt_id");--> statement-breakpoint
REVOKE ALL ON SCHEMA "conceptly_private" FROM anon, authenticated;--> statement-breakpoint
REVOKE ALL ON ALL TABLES IN SCHEMA "conceptly_private" FROM anon, authenticated;--> statement-breakpoint
REVOKE ALL ON ALL SEQUENCES IN SCHEMA "conceptly_private" FROM anon, authenticated;--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA "conceptly_private" REVOKE ALL ON TABLES FROM anon, authenticated;--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA "conceptly_private" REVOKE ALL ON SEQUENCES FROM anon, authenticated;
