import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";

export default function SignUpPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--bg)] px-4 py-10 text-[var(--ink)]">
      <section className="w-full max-w-md rounded-lg border border-[var(--line)] bg-white p-6 shadow-xl shadow-slate-900/5">
        <Link href="/" className="mb-8 inline-flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--ink)] text-sm font-black text-white">
            C
          </span>
          <span className="text-lg font-semibold">Conceptly</span>
        </Link>
        <h1 className="text-3xl font-semibold">Create account</h1>
        <p className="mt-3 leading-7 text-[var(--muted)]">
          Unlimited access to the two default AI Foundations chapters.
        </p>
        <div className="mt-6">
          <Suspense>
            <AuthForm mode="sign-up" />
          </Suspense>
        </div>
        <p className="mt-6 text-sm text-[var(--muted)]">
          Already registered?{" "}
          <Link className="font-semibold text-[var(--indigo)]" href="/sign-in">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
