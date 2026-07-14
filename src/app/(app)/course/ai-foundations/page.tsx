import Link from "next/link";
import { Check, Lock, Play, RotateCcw } from "lucide-react";
import { getLearningSnapshot } from "@/lib/learning";
import { requireUser } from "@/lib/session";

export default async function CourseMapPage() {
  const session = await requireUser();
  const snapshot = await getLearningSnapshot(session.user.id);

  return (
    <div className="grid gap-8">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--indigo)]">
          Course map
        </p>
        <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">
          {snapshot.course.title}
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--muted)]">
          Twenty ordered steps across the two default chapters. Completed steps can be replayed without duplicate XP.
        </p>
      </section>

      <div className="grid gap-8">
        {snapshot.course.chapters.map((chapter) => (
          <section className="course-instrument p-5" key={chapter.id}>
            <div className="mb-5">
              <p className="text-sm font-semibold text-[var(--indigo)]">Chapter {chapter.order}</p>
              <h2 className="text-2xl font-semibold">{chapter.title}</h2>
              <p className="mt-2 leading-7 text-[var(--muted)]">{chapter.description}</p>
            </div>
            <div className="grid gap-3">
              {snapshot.steps
                .filter((item) => item.step.chapterSlug === chapter.slug)
                .map((item, index) => {
                  const href = `/learn/ai-foundations/${item.step.chapterSlug}/${item.step.slug}`;
                  const icon =
                    item.status === "completed" ? (
                      <Check size={18} />
                    ) : item.status === "locked" ? (
                      <Lock size={18} />
                    ) : (
                      <Play size={18} />
                    );
                  return (
                    <div className="chapter-preview" key={item.step.id}>
                      <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--paper)] font-mono font-bold">
                        {index + 1}
                      </span>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h3 className="font-semibold">{item.step.title}</h3>
                          <p className="text-sm text-[var(--muted)]">
                            {item.status === "completed"
                              ? "Completed"
                              : item.status === "locked"
                                ? "Locked"
                                : "Available"}
                          </p>
                        </div>
                        {item.status === "locked" ? (
                          <button className="secondary-button opacity-60" disabled type="button">
                            {icon}
                            Locked
                          </button>
                        ) : (
                          <Link className={item.status === "completed" ? "secondary-button" : "primary-button"} href={href}>
                            {item.status === "completed" ? <RotateCcw size={18} /> : icon}
                            {item.status === "completed" ? "Review" : "Start"}
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
