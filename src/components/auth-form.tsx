"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/learn";

  function submit(formData: FormData) {
    setError("");
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");
    const name = String(formData.get("name") ?? "").trim() || email.split("@")[0];

    if (!email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 12 || password.length > 128) {
      setError("Password must be 12 to 128 characters.");
      return;
    }

    startTransition(async () => {
      const result =
        mode === "sign-up"
          ? await authClient.signUp.email({ email, password, name })
          : await authClient.signIn.email({ email, password });

      if (result.error) {
        setError("Email or password is incorrect.");
        return;
      }

      router.push(next);
      router.refresh();
    });
  }

  return (
    <form action={submit} className="grid gap-4">
      {mode === "sign-up" ? (
        <label className="field-label">
          Display name
          <input className="field-input" name="name" autoComplete="name" placeholder="Ada" />
        </label>
      ) : null}
      <label className="field-label">
        Email
        <input className="field-input" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
      </label>
      <label className="field-label">
        Password
        <input className="field-input" name="password" type="password" autoComplete={mode === "sign-up" ? "new-password" : "current-password"} minLength={12} maxLength={128} required />
      </label>
      {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}
      <button className="primary-button" type="submit" disabled={isPending}>
        {isPending ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} />}
        {mode === "sign-up" ? "Create account" : "Sign in"}
      </button>
    </form>
  );
}
