import { notFound, redirect } from "next/navigation";
import { ClassSession } from "@/components/class-session";
import { getChapterClassSession } from "@/lib/content/class-sessions";
import { getCourse } from "@/lib/content/course";
import { getLearningSnapshot } from "@/lib/learning";
import { requireUser } from "@/lib/session";

type Params = Promise<{ chapter: string }>;

export default async function ChapterClassPage({ params }: { params: Params }) {
  const session = await requireUser();
  const { chapter: chapterSlug } = await params;
  const classSession = getChapterClassSession(chapterSlug);
  const chapter = getCourse().chapters.find((item) => item.slug === chapterSlug);
  if (!classSession || !chapter) notFound();

  const snapshot = await getLearningSnapshot(session.user.id);
  const chapterSteps = chapter.steps;
  const firstStep = chapterSteps[0];
  const previousChapter = getCourse().chapters.find(
    (item) => item.order === chapter.order - 1,
  );

  if (previousChapter && !snapshot.profile.unlock_all) {
    const previousComplete = previousChapter.steps.every((step) =>
      snapshot.completed.has(step.id),
    );
    if (!previousComplete) redirect("/course/ai-foundations");
  }

  return (
    <ClassSession
      session={classSession}
      continueHref={`/learn/ai-foundations/${chapter.slug}/${firstStep.slug}`}
      courseHref="/course/ai-foundations"
    />
  );
}
