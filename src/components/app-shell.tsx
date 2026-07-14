import Link from "next/link";
import { BookOpen, Compass, Settings } from "lucide-react";

export function AppShell({
  children,
  displayName,
}: {
  children: React.ReactNode;
  displayName: string;
}) {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[rgba(250,248,242,0.88)] backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/learn" className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--ink)] text-sm font-black text-white">
              C
            </span>
            <span className="text-lg font-semibold tracking-normal">Conceptly</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link className="nav-pill" href="/learn">
              <Compass size={17} />
              Learn
            </Link>
            <Link className="nav-pill hidden sm:flex" href="/course/ai-foundations">
              <BookOpen size={17} />
              Course
            </Link>
            <Link className="icon-pill" href="/settings" aria-label={`Settings for ${displayName}`}>
              <Settings size={18} />
            </Link>
          </div>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
    </div>
  );
}
