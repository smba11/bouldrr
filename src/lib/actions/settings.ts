"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireUser, requireSupabase } from "@/lib/auth";
export type SettingsState = { error?: string; success?: boolean };
export async function updateSettingsAction(
  _state: SettingsState,
  form: FormData,
): Promise<SettingsState> {
  const parsed = z
    .object({
      fullName: z.string().trim().min(2).max(120),
      preferredLanguage: z.enum(["en", "es"]),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return { error: "Enter your name and choose a language preference." };
  const user = await requireUser();
  const db = await requireSupabase();
  if (!db) return { error: "Your workspace couldn’t connect. Try again." };
  const { error } = await db.from("profiles").upsert({
    id: user.id,
    full_name: parsed.data.fullName,
    preferred_language: parsed.data.preferredLanguage,
  });
  if (error) return { error: "Your profile couldn’t be saved. Try again." };
  revalidatePath("/settings");
  return { success: true };
}
