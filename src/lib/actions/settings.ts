"use server";

import { revalidatePath } from "next/cache";
import { requireUser, requireSupabase } from "@/lib/auth";

export async function updateSettingsAction(formData: FormData) {
  const user = await requireUser();
  const supabase = await requireSupabase();

  if (!supabase) {
    return;
  }

  await supabase.from("profiles").upsert({
    id: user.id,
    full_name: String(formData.get("fullName") ?? "").trim() || null,
    preferred_language: String(formData.get("preferredLanguage") ?? "en"),
    updated_at: new Date().toISOString(),
  });

  revalidatePath("/settings");
}
