import { AppShell } from "@/components/app-shell";
import { getLearningSnapshot } from "@/lib/learning";
import { requireUser } from "@/lib/session";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireUser();
  let displayName = session.user.name || "Learner";

  try {
    const snapshot = await getLearningSnapshot(session.user.id);
    displayName = snapshot.profile.display_name;
  } catch {
    displayName = session.user.name || "Learner";
  }

  return <AppShell displayName={displayName}>{children}</AppShell>;
}
