import { notFound, redirect } from "next/navigation";
import { LessonPlayer } from "@/components/lesson-player";
import { allSteps, getNextStep, getStepByRoute } from "@/lib/content/course";
import { isStepUnlocked, getLearningSnapshot } from "@/lib/learning";
import { requireUser } from "@/lib/session";
import { toClientStep } from "@/lib/content/types";

type Params = Promise<{ chapter: string; step: string }>;

export default async function LessonPage({ params }: { params: Params }) {
  const session = await requireUser();
  const { chapter, step: stepSlug } = await params;
  const step = getStepByRoute(chapter, stepSlug);
  if (!step) notFound();

  const snapshot = await getLearningSnapshot(session.user.id);
  if (
    !isStepUnlocked(step, snapshot.completed, snapshot.profile.unlock_all) &&
    !snapshot.completed.has(step.id)
  ) {
    redirect("/course/ai-foundations");
  }

  const index = allSteps.findIndex((item) => item.id === step.id);
  const next = getNextStep(step.id);

  return (
    <LessonPlayer
      step={toClientStep(step)}
      stepNumber={index + 1}
      totalSteps={allSteps.length}
      nextHref={
        next
          ? next.order === 1
            ? `/learn/ai-foundations/${next.chapterSlug}/class`
            : `/learn/ai-foundations/${next.chapterSlug}/${next.slug}`
          : null
      }
      courseHref="/course/ai-foundations"
    />
  );
}
