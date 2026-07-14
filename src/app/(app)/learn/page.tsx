import Link from "next/link";
import { ArrowRight, Flame, Trophy } from "lucide-react";
import { getLearningSnapshot } from "@/lib/learning";
import { requireUser } from "@/lib/session";

export default async function LearnPage() {
  const session = await requireUser();
  const snapshot = await getLearningSnapshot(session.user.id);
  const completedCount = snapshot.completed.size;
  const total = snapshot.steps.length;
  const next = snapshot.steps.find((item) => item.status !== "completed");
  const progress = Math.round((completedCount / total) * 100);

  return (
    <div className="grid gap-8">
      <section className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--indigo)]">
            Dashboard
          </p>
          <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">
            Welcome back, {snapshot.profile.display_name}
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--muted)]">
            Continue through the two default AI Foundations chapters: The Language of AI, then Markdown and JSON.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Stat icon={<Trophy size={19} />} label="XP" value={snapshot.stats.total_xp} />
          <Stat icon={<Flame size={19} />} label="Streak" value={snapshot.stats.current_streak} />
        </div>
      </section>

      <section className="course-instrument p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--muted)]">Resume</p>
            <h2 className="text-2xl font-semibold">
              {next ? next.step.title : "Course complete"}
            </h2>
          </div>
          {next ? (
            <Link className="primary-button" href={`/learn/ai-foundations/${next.step.chapterSlug}/${next.step.slug}`}>
              Resume
              <ArrowRight size={18} />
            </Link>
          ) : (
            <Link className="secondary-button" href="/course/ai-foundations">
              Review
              <ArrowRight size={18} />
            </Link>
          )}
        </div>
        <div className="mt-5 h-3 overflow-hidden rounded-full bg-[var(--line)]">
          <div className="h-full bg-[var(--green)]" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-3 text-sm font-semibold text-[var(--muted)]">
          {completedCount} of {total} steps completed
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {snapshot.course.chapters.map((chapter) => {
          const chapterSteps = snapshot.steps.filter((item) => item.step.chapterSlug === chapter.slug);
          const done = chapterSteps.filter((item) => item.status === "completed").length;
          const locked = chapterSteps.every((item) => item.status === "locked");
          return (
            <article className="feature-card" key={chapter.id}>
              <p className="text-sm font-semibold text-[var(--indigo)]">Chapter {chapter.order}</p>
              <h2 className="mt-2 text-2xl font-semibold">{chapter.title}</h2>
              <p className="mt-3 leading-7 text-[var(--muted)]">{chapter.description}</p>
              <p className="mt-5 text-sm font-semibold">{done}/10 complete</p>
              <Link className={locked ? "secondary-button mt-5 opacity-60" : "secondary-button mt-5"} href="/course/ai-foundations">
                {locked ? "Locked" : "Open map"}
                <ArrowRight size={18} />
              </Link>
            </article>
          );
        })}
      </section>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-white p-4">
      <div className="mb-3 text-[var(--indigo)]">{icon}</div>
      <p className="text-sm font-semibold text-[var(--muted)]">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}
