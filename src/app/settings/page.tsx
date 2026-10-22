import { requireSupabase, requireUser } from "@/lib/auth";
import { getDashboardProjects } from "@/lib/data/projects";
import { SettingsForm } from "@/components/settings/settings-form";
import { WorkspaceShell } from "@/components/workspace/shell";
import { PageHeader } from "@/components/workspace/primitives";
export default async function SettingsPage() {
  const user = await requireUser();
  const db = await requireSupabase();
  const [profile, projects] = await Promise.all([
    db?.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    getDashboardProjects(user.id),
  ]);
  if (profile?.error)
    throw new Error("Your profile couldn’t be loaded. Try again.");
  return (
    <WorkspaceShell projects={projects}>
      <PageHeader
        eyebrow="Make yourself at home"
        title="Settings"
        description="Your profile and workspace preferences."
      />
      <SettingsForm
        fullName={profile?.data?.full_name}
        preferredLanguage={profile?.data?.preferred_language}
      />
    </WorkspaceShell>
  );
}
