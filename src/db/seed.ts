import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { courses, chapters, lessonSteps } from "@/db/schema";
import { aiFoundationsCourse } from "@/lib/content/course";
import { validateCourseContent } from "@/lib/content/grading";
import * as schema from "@/db/schema";

config({ path: ".env.local" });
config();

const connectionString =
  process.env.DATABASE_URL ?? process.env.DATABASE_DIRECT_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL or DATABASE_DIRECT_URL is required to seed.");
}

const pool = new Pool({
  connectionString,
  max: 1,
  ssl: connectionString.includes("supabase.com")
    ? { rejectUnauthorized: false }
    : undefined,
});

const db = drizzle(pool, { schema });

async function seed() {
  validateCourseContent();

  await db
    .insert(courses)
    .values({
      id: aiFoundationsCourse.id,
      slug: aiFoundationsCourse.slug,
      title: aiFoundationsCourse.title,
      description: aiFoundationsCourse.description,
      order: 1,
      isPublished: true,
    })
    .onConflictDoUpdate({
      target: courses.id,
      set: {
        slug: aiFoundationsCourse.slug,
        title: aiFoundationsCourse.title,
        description: aiFoundationsCourse.description,
        order: 1,
        isPublished: true,
      },
    });

  for (const chapter of aiFoundationsCourse.chapters) {
    await db
      .insert(chapters)
      .values({
        id: chapter.id,
        courseId: aiFoundationsCourse.id,
        prerequisiteChapterId:
          chapter.order === 1
            ? null
            : aiFoundationsCourse.chapters[chapter.order - 2]?.id ?? null,
        slug: chapter.slug,
        title: chapter.title,
        description: chapter.description,
        order: chapter.order,
      })
      .onConflictDoUpdate({
        target: chapters.id,
        set: {
          slug: chapter.slug,
          title: chapter.title,
          description: chapter.description,
          order: chapter.order,
          prerequisiteChapterId:
            chapter.order === 1
              ? null
              : aiFoundationsCourse.chapters[chapter.order - 2]?.id ?? null,
        },
      });

    for (const step of chapter.steps) {
      await db
        .insert(lessonSteps)
        .values({
          id: step.id,
          chapterId: chapter.id,
          slug: step.slug,
          kind: step.kind,
          title: step.title,
          prompt: step.prompt,
          privateSolution: step.solution,
          misconceptionFeedback: step.feedback,
          tutorContext: step.tutorContext,
          order: step.order,
          xp: step.xp,
        })
        .onConflictDoUpdate({
          target: lessonSteps.id,
          set: {
            slug: step.slug,
            kind: step.kind,
            title: step.title,
            prompt: step.prompt,
            privateSolution: step.solution,
            misconceptionFeedback: step.feedback,
            tutorContext: step.tutorContext,
            order: step.order,
            xp: step.xp,
          },
        });
    }
  }
}

seed()
  .then(async () => {
    await pool.end();
    console.log("Seeded AI Foundations: 2 chapters, 20 steps.");
  })
  .catch(async (error) => {
    await pool.end();
    console.error(error);
    process.exit(1);
  });
