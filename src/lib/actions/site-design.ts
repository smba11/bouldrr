"use server";
import { revalidatePath } from "next/cache";
import { requireUser, requireSupabase } from "@/lib/auth";
import { saveDesignSchema } from "@/lib/validation/site-design";
import type { Json } from "@/lib/types";
export async function saveSiteDesignAction(
  input: unknown,
): Promise<{ error?: string; revision?: number }> {
  const parsed = saveDesignSchema.safeParse(input);
  if (!parsed.success)
    return {
      error: "Review the design. Each shape needs a name and valid geometry.",
    };
  const user = await requireUser();
  const db = await requireSupabase();
  if (!db)
    return { error: "Your workspace connection is unavailable. Try again." };
  const { data: project } = await db
    .from("projects")
    .select("id")
    .eq("id", parsed.data.projectId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!project) return { error: "This project is unavailable." };
  const { data, error } = await db.rpc("save_site_design", {
    input: parsed.data as unknown as Json,
  });
  if (error)
    return {
      error: error.message.includes("another session")
        ? "This plan changed in another session. Reload the page before saving."
        : "We couldn’t save your plan. Your changes are still here; try again.",
    };
  revalidatePath(`/projects/${parsed.data.projectId}/property`);
  revalidatePath(`/projects/${parsed.data.projectId}`);
  return { revision: data };
}
