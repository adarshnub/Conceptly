import "server-only";

import crypto from "node:crypto";
import type { PoolClient } from "pg";
import { pool, assertDatabaseConfigured } from "@/db";
import { allSteps, getCourse, getNextStep, getPreviousStep, getStepById } from "@/lib/content/course";
import { gradeStep } from "@/lib/content/grading";
import { toClientStep, type Feedback, type LessonStep } from "@/lib/content/types";
import { getEnv } from "@/lib/env";

export type ProgressRecord = {
  stepId: string;
  status: "available" | "completed" | "locked";
  attempts: number;
};

export type AttemptResult = {
  correct: boolean;
  feedback: Feedback;
  progress: {
    stepCompleted: boolean;
    nextStepSlug: string | null;
    chapterCompleted: boolean;
    xpAwarded: number;
    streak: number;
  };
  tutorTrigger: { interventionId: string } | null;
};

function localDate(timezone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function previousLocalDate(dateString: string) {
  const date = new Date(`${dateString}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

export function isStepUnlocked(
  step: LessonStep,
  completed: Set<string>,
  unlockAll = false,
) {
  if (unlockAll) return true;
  const previous = getPreviousStep(step.id);
  return !previous || completed.has(previous.id);
}

async function ensureLearningRowsWithExecutor(
  executor: Pick<PoolClient, "query"> | typeof pool,
  userId: string,
) {
  await executor.query(
    `insert into conceptly_private.learning_stats (user_id)
     values ($1)
     on conflict (user_id) do nothing`,
    [userId],
  );
  await executor.query(
    `insert into conceptly_private.profiles (user_id, display_name, timezone)
     select id, coalesce(nullif(name, ''), split_part(email, '@', 1)), 'UTC'
     from conceptly_private.user
     where id = $1
     on conflict (user_id) do nothing`,
    [userId],
  );
}

async function ensureLearningRows(userId: string) {
  await ensureLearningRowsWithExecutor(pool, userId);
}

export async function getLearningSnapshot(userId: string) {
  assertDatabaseConfigured();
  await ensureLearningRows(userId);

  const [progress, stats, profile] = await Promise.all([
    pool.query<{
      step_id: string;
      status: "available" | "completed" | "locked";
      attempts: number;
    }>(
      `select step_id, status, attempts
       from conceptly_private.step_progress
       where user_id = $1`,
      [userId],
    ),
    pool.query<{
      total_xp: number;
      current_streak: number;
      longest_streak: number;
      last_qualifying_date: string | null;
    }>(
      `select total_xp, current_streak, longest_streak, last_qualifying_date
       from conceptly_private.learning_stats
       where user_id = $1`,
      [userId],
    ),
    pool.query<{ display_name: string; timezone: string; unlock_all: boolean }>(
      `select display_name, timezone, unlock_all
       from conceptly_private.profiles
       where user_id = $1`,
      [userId],
    ),
  ]);

  const progressMap = new Map(
    progress.rows.map((row) => [
      row.step_id,
      { stepId: row.step_id, status: row.status, attempts: row.attempts },
    ]),
  );
  const completed = new Set(
    progress.rows
      .filter((row) => row.status === "completed")
      .map((row) => row.step_id),
  );
  const currentProfile = profile.rows[0] ?? {
    display_name: "Learner",
    timezone: "UTC",
    unlock_all: false,
  };

  return {
    course: getCourse(),
    steps: allSteps.map((step) => {
      const existing = progressMap.get(step.id);
      const status = completed.has(step.id)
        ? "completed"
        : isStepUnlocked(step, completed, currentProfile.unlock_all)
          ? "available"
          : "locked";
      return {
        step,
        clientStep: toClientStep(step),
        progress: existing ?? { stepId: step.id, status, attempts: 0 },
        status,
      };
    }),
    stats: stats.rows[0] ?? {
      total_xp: 0,
      current_streak: 0,
      longest_streak: 0,
      last_qualifying_date: null,
    },
    profile: currentProfile,
    completed,
  };
}

async function updateDailyAndStats(
  client: PoolClient,
  userId: string,
  timezone: string,
  xpAwarded: number,
  newStep: boolean,
  chapterCompleted: boolean,
) {
  const today = localDate(timezone);
  const activity = await client.query<{
    qualifies_for_streak: boolean;
  }>(
    `insert into conceptly_private.daily_activity
       (user_id, local_date, new_steps, chapter_completions, xp, qualifies_for_streak, updated_at)
     values ($1, $2, $3, $4, $5, ($3 >= 3 or $4 >= 1), now())
     on conflict (user_id, local_date) do update set
       new_steps = conceptly_private.daily_activity.new_steps + excluded.new_steps,
       chapter_completions = conceptly_private.daily_activity.chapter_completions + excluded.chapter_completions,
       xp = conceptly_private.daily_activity.xp + excluded.xp,
       qualifies_for_streak =
         (conceptly_private.daily_activity.new_steps + excluded.new_steps >= 3)
         or (conceptly_private.daily_activity.chapter_completions + excluded.chapter_completions >= 1),
       updated_at = now()
     returning qualifies_for_streak`,
    [userId, today, newStep ? 1 : 0, chapterCompleted ? 1 : 0, xpAwarded],
  );

  const stats = await client.query<{
    current_streak: number;
    longest_streak: number;
    last_qualifying_date: string | null;
  }>(
    `select current_streak, longest_streak, last_qualifying_date
     from conceptly_private.learning_stats
     where user_id = $1
     for update`,
    [userId],
  );

  const current = stats.rows[0] ?? {
    current_streak: 0,
    longest_streak: 0,
    last_qualifying_date: null,
  };
  let nextStreak = current.current_streak;
  let nextLongest = current.longest_streak;
  let nextQualifyingDate = current.last_qualifying_date;

  if (activity.rows[0]?.qualifies_for_streak && current.last_qualifying_date !== today) {
    const yesterday = previousLocalDate(today);
    nextStreak = current.last_qualifying_date === yesterday ? current.current_streak + 1 : 1;
    nextLongest = Math.max(current.longest_streak, nextStreak);
    nextQualifyingDate = today;
  }

  await client.query(
    `insert into conceptly_private.learning_stats
       (user_id, total_xp, current_streak, longest_streak, last_qualifying_date, updated_at)
     values ($1, $2, $3, $4, $5, now())
     on conflict (user_id) do update set
       total_xp = conceptly_private.learning_stats.total_xp + excluded.total_xp,
       current_streak = excluded.current_streak,
       longest_streak = excluded.longest_streak,
       last_qualifying_date = excluded.last_qualifying_date,
       updated_at = now()`,
    [userId, xpAwarded, nextStreak, nextLongest, nextQualifyingDate],
  );

  return nextStreak;
}

export async function recordAttempt(
  userId: string,
  stepId: string,
  clientAttemptId: string,
  answer: unknown,
): Promise<AttemptResult> {
  assertDatabaseConfigured();
  const step = getStepById(stepId);
  if (!step) {
    throw Object.assign(new Error("Unknown lesson step."), { status: 422 });
  }

  const client = await pool.connect();
  try {
    await client.query("begin");
    await ensureLearningRowsWithExecutor(client, userId);

    const profile = await client.query<{ timezone: string; unlock_all: boolean }>(
      `select timezone, unlock_all from conceptly_private.profiles where user_id = $1 for update`,
      [userId],
    );
    const timezone = profile.rows[0]?.timezone ?? "UTC";

    const completedRows = await client.query<{ step_id: string }>(
      `select step_id from conceptly_private.step_progress
       where user_id = $1 and status = 'completed'
       for update`,
      [userId],
    );
    const completed = new Set(completedRows.rows.map((row) => row.step_id));

    if (
      !isStepUnlocked(step, completed, profile.rows[0]?.unlock_all ?? false) &&
      !completed.has(step.id)
    ) {
      throw Object.assign(new Error("This lesson step is locked."), { status: 409 });
    }

    const existing = await client.query<{
      is_correct: boolean;
      feedback_code: string;
    }>(
      `select is_correct, feedback_code
       from conceptly_private.step_attempts
       where user_id = $1 and client_attempt_id = $2`,
      [userId, clientAttemptId],
    );

    if (existing.rows[0]) {
      await client.query("commit");
      const feedback = existing.rows[0].is_correct
        ? step.correctFeedback
        : step.feedback[existing.rows[0].feedback_code];
      return {
        correct: existing.rows[0].is_correct,
        feedback,
        progress: {
          stepCompleted: completed.has(step.id),
          nextStepSlug: getNextStep(step.id)?.slug ?? null,
          chapterCompleted: false,
          xpAwarded: 0,
          streak: 0,
        },
        tutorTrigger: null,
      };
    }

    const grade = gradeStep(step, answer);
    const previousCompleted = completed.has(step.id);
    const firstCompletion = grade.correct && !previousCompleted;

    const attempt = await client.query<{ id: string }>(
      `insert into conceptly_private.step_attempts
        (user_id, step_id, client_attempt_id, submitted_answer, is_correct, feedback_code)
       values ($1, $2, $3, $4::jsonb, $5, $6)
       returning id`,
      [userId, step.id, clientAttemptId, JSON.stringify(answer), grade.correct, grade.feedback.code],
    );

    await client.query(
      `insert into conceptly_private.step_progress
        (user_id, step_id, status, attempts, first_completed_at, last_activity_at)
       values ($1, $2, $3::step_status, 1, case when $3 = 'completed' then now() else null end, now())
       on conflict (user_id, step_id) do update set
        attempts = conceptly_private.step_progress.attempts + 1,
        status = case when $3 = 'completed' then 'completed'::step_status else conceptly_private.step_progress.status end,
        first_completed_at = coalesce(conceptly_private.step_progress.first_completed_at, case when $3 = 'completed' then now() else null end),
        last_activity_at = now()`,
      [userId, step.id, grade.correct ? "completed" : "available"],
    );

    if (firstCompletion) completed.add(step.id);
    const chapterSteps = allSteps.filter((item) => item.chapterSlug === step.chapterSlug);
    const chapterCompleted =
      firstCompletion && chapterSteps.every((item) => completed.has(item.id));
    const xpAwarded = firstCompletion ? step.xp + (chapterCompleted ? 50 : 0) : 0;
    const streak = await updateDailyAndStats(
      client,
      userId,
      timezone,
      xpAwarded,
      firstCompletion,
      chapterCompleted,
    );

    let tutorTrigger: { interventionId: string } | null = null;
    if (!grade.correct) {
      const wrongAttempts = await client.query<{ count: string }>(
        `select count(*)::text as count
         from conceptly_private.step_attempts
         where user_id = $1 and step_id = $2 and is_correct = false
           and created_at::date = now()::date`,
        [userId, step.id],
      );
      const wrongCount = Number(wrongAttempts.rows[0]?.count ?? 0);
      if (wrongCount === 2 || wrongCount === 4) {
        const env = getEnv();
        const intervention = await client.query<{ id: string }>(
          `insert into conceptly_private.tutor_interventions
            (user_id, step_id, triggering_attempt_id, model, status)
           values ($1, $2, $3, $4, 'pending')
           returning id`,
          [userId, step.id, attempt.rows[0].id, env.OPENAI_MODEL],
        );
        tutorTrigger = { interventionId: intervention.rows[0].id };
      }
    }

    await client.query("commit");

    return {
      correct: grade.correct,
      feedback: grade.feedback,
      progress: {
        stepCompleted: firstCompletion,
        nextStepSlug: getNextStep(step.id)?.slug ?? null,
        chapterCompleted,
        xpAwarded,
        streak,
      },
      tutorTrigger,
    };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export function hashedSafetyIdentifier(userId: string) {
  const secret = getEnv().BETTER_AUTH_SECRET ?? "conceptly";
  return crypto.createHash("sha256").update(`${secret}:${userId}`).digest("hex");
}
