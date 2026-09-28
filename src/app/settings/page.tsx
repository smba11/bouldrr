import Link from "next/link";
import { SettingsForm } from "@/components/settings/settings-form";
import { requireSupabase, requireUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default async function SettingsPage() {
  const user = await requireUser();
  const supabase = await requireSupabase();
  const { data: profile } = supabase
    ? await supabase.from("profiles").select("*").eq("id", user.id).single()
    : { data: null };

  return (
    <main className="min-h-screen bg-muted/20 px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
            <p className="mt-2 text-muted-foreground">
              Manage your profile and localization preference.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>
        <SettingsForm
          fullName={profile?.full_name}
          preferredLanguage={profile?.preferred_language}
        />
      </div>
    </main>
  );
}
