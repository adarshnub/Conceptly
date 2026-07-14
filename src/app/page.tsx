import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, Sparkles, Waypoints } from "lucide-react";
import { getCourse } from "@/lib/content/course";

export default function Home() {
  const course = getCourse();

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <section className="hero-scene">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--ink)] text-sm font-black text-white">
              C
            </span>
            <span className="text-lg font-semibold">Conceptly</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link className="nav-pill" href="/sign-in">
              Sign in
            </Link>
            <Link className="primary-button" href="/sign-up">
              Start
              <ArrowRight size={18} />
            </Link>
          </div>
        </nav>

        <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-14 pt-10 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:pt-16">
          <div>
            <p className="mb-4 inline-flex rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm font-semibold text-[var(--indigo)]">
              AI Foundations, no paywalls
            </p>
            <h1 className="max-w-3xl text-5xl font-semibold leading-[1.02] sm:text-7xl">
              Conceptly
            </h1>
            <p className="mt-6 max-w-2xl text-xl leading-9 text-[var(--muted)]">
              Learn AI vocabulary, prompting, Markdown, and JSON through short interactive problems with immediate feedback.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link className="primary-button" href="/sign-up">
                Create free account
                <ArrowRight size={18} />
              </Link>
              <Link className="secondary-button" href="/course/ai-foundations">
                Preview course
                <BookOpen size={18} />
              </Link>
            </div>
          </div>

          <div className="course-instrument" aria-label="Conceptly course preview">
            <div className="flex items-center justify-between border-b border-[var(--line)] p-4">
              <div>
                <p className="text-sm font-semibold text-[var(--muted)]">Current course</p>
                <h2 className="text-2xl font-semibold">{course.title}</h2>
              </div>
              <span className="rounded-lg bg-[var(--amber)] px-3 py-2 text-sm font-bold text-[var(--ink)]">20 steps</span>
            </div>
            <div className="grid gap-3 p-4">
              {course.chapters.map((chapter, chapterIndex) => (
                <div className="chapter-preview" key={chapter.id}>
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--paper)] font-mono font-bold">
                    {chapterIndex + 1}
                  </span>
                  <div>
                    <p className="font-semibold">{chapter.title}</p>
                    <p className="text-sm leading-6 text-[var(--muted)]">{chapter.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-12 sm:px-6 md:grid-cols-3">
        <Feature icon={<Waypoints size={22} />} title="Sequential path" copy="Each step unlocks only after the prior concept lands." />
        <Feature icon={<CheckCircle2 size={22} />} title="Authored feedback" copy="Wrong answers map to specific misconceptions, not generic nudges." />
        <Feature icon={<Sparkles size={22} />} title="Coach support" copy="After repeated misses, an OpenAI coach can ask a guiding question." />
      </section>
    </main>
  );
}

function Feature({ icon, title, copy }: { icon: React.ReactNode; title: string; copy: string }) {
  return (
    <article className="feature-card">
      <div className="mb-5 grid h-11 w-11 place-items-center rounded-lg bg-[var(--ink)] text-white">
        {icon}
      </div>
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-3 leading-7 text-[var(--muted)]">{copy}</p>
    </article>
  );
}
