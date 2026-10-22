"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireUser, requireSupabase } from "@/lib/auth";
export type PropertyFormState = { error?: string; success?: boolean };
export async function updatePropertyAction(
  _state: PropertyFormState,
  form: FormData,
): Promise<PropertyFormState> {
  const parsed = z
    .object({
      projectId: z.string().uuid(),
      address: z.string().trim().min(3).max(250),
      city: z.string().trim().min(2).max(120),
      state: z.string().trim().min(2).max(120),
      postalCode: z.string().trim().min(3).max(30),
      county: z.string().trim().max(120),
      latitude: z.union([z.literal(""), z.coerce.number().min(-90).max(90)]),
      longitude: z.union([z.literal(""), z.coerce.number().min(-180).max(180)]),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return {
      error:
        "Review the address and coordinates. Latitude must be −90 to 90; longitude −180 to 180.",
    };
  const d = parsed.data;
  if ((d.latitude === "") !== (d.longitude === ""))
    return { error: "Enter both coordinates, or leave both blank." };
  const user = await requireUser();
  const db = await requireSupabase();
  if (!db) return { error: "The workspace couldn’t connect. Try again." };
  const { data: project } = await db
    .from("projects")
    .select("id")
    .eq("id", d.projectId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!project) return { error: "This project is unavailable." };
  const { data, error } = await db
    .from("properties")
    .update({
      address_line_1: d.address,
      city: d.city,
      state: d.state,
      postal_code: d.postalCode,
      county: d.county || null,
      latitude: d.latitude === "" ? null : d.latitude,
      longitude: d.longitude === "" ? null : d.longitude,
      formatted_address: null,
      google_place_id: null,
      jurisdiction_id: null,
    })
    .eq("project_id", d.projectId)
    .select("id");
  if (error || !data?.length)
    return { error: "The property couldn’t be saved. Try again." };
  revalidatePath(`/projects/${d.projectId}`, "layout");
  revalidatePath("/dashboard");
  return { success: true };
}
