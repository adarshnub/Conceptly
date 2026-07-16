import Link from "next/link";
import { ArrowRight, Clock, Gauge, Mail, Shield } from "lucide-react";
import { SignOutButton } from "@/components/sign-out-button";
import { getLearningSnapshot } from "@/lib/learning";
import { requireUser } from "@/lib/session";

export default async function SettingsPage() {
  const session = await requireUser();
  const snapshot = await getLearningSnapshot(session.user.id);

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--indigo)]">
          Settings
        </p>
        <h1 className="mt-3 text-4xl font-semibold">Account</h1>
      </section>

      <section className="course-instrument p-5">
        <div className="grid gap-4">
          <Info icon={<Mail size={18} />} label="Email" value={session.user.email} />
          <Info icon={<Shield size={18} />} label="Display name" value={snapshot.profile.display_name} />
          <Info icon={<Clock size={18} />} label="Timezone" value={snapshot.profile.timezone} />
          <Info icon={<Shield size={18} />} label="Session" value="Seven-day sliding cookie session" />
        </div>
        <div className="mt-6">
          <SignOutButton />
        </div>
      </section>

      <Link className="settings-usage-link" href="/settings/ai-usage">
        <span className="settings-usage-icon"><Gauge size={22} /></span>
        <span><strong>AI usage and cost</strong><small>Monitor tokens, generated voice, requests, and estimated spend.</small></span>
        <ArrowRight size={20} />
      </Link>
    </div>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[var(--line)] bg-white p-4">
      <span className="text-[var(--indigo)]">{icon}</span>
      <div>
        <p className="text-sm font-semibold text-[var(--muted)]">{label}</p>
        <p className="font-semibold">{value}</p>
      </div>
    </div>
  );
}
