"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { starterTasks } from "@/lib/constants";
import { requireUser, requireSupabase } from "@/lib/auth";
import type { TaskStatus } from "@/lib/types";

export type ProjectFormState = {
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

const projectSchema = z.object({
  projectType: z.string().min(1, "Choose a project type."),
  addressLine1: z.string().min(3, "Enter a street address."),
  city: z.string().min(2, "Enter a city."),
  state: z.string().min(2, "Enter a state."),
  postalCode: z.string().min(3, "Enter a ZIP or postal code."),
  description: z.string().min(8, "Describe what you want to do."),
});

function titleCase(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export async function createProjectAction(
  _state: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const parsed = projectSchema.safeParse({
    projectType: formData.get("projectType"),
    addressLine1: formData.get("addressLine1"),
    city: formData.get("city"),
    state: formData.get("state"),
    postalCode: formData.get("postalCode"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      message: "Please review the highlighted fields.",
    };
  }

  const user = await requireUser();
  const supabase = await requireSupabase();

  if (!supabase) {
    return {
      message:
        "Supabase is not configured yet. Add the public Supabase variables before creating projects.",
    };
  }

  const name = `${titleCase(parsed.data.addressLine1)}, ${titleCase(
    parsed.data.city,
  )}`;

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      name,
      project_type: parsed.data.projectType,
      description: parsed.data.description,
      status: "planning",
    })
    .select("id")
    .single();

  if (projectError || !project) {
    return { message: projectError?.message ?? "Could not create project." };
  }

  const { error: propertyError } = await supabase.from("properties").insert({
    project_id: project.id,
    address_line_1: titleCase(parsed.data.addressLine1),
    city: titleCase(parsed.data.city),
    state: parsed.data.state.trim().toUpperCase(),
    postal_code: parsed.data.postalCode.trim(),
    county: null,
    address_line_2: null,
    latitude: null,
    longitude: null,
    parcel_number: null,
  });

  if (propertyError) {
    return { message: propertyError.message };
  }

  const { error: tasksError } = await supabase.from("project_tasks").insert(
    starterTasks.map((task) => ({
      project_id: project.id,
      parent_task_id: null,
      category: task.category,
      title: task.title,
      description: task.description,
      instructions: task.instructions,
      status: "not_started",
      priority: task.priority,
      due_date: null,
      regulation_source_id: null,
      sort_order: task.sortOrder,
    })),
  );

  if (tasksError) {
    return { message: tasksError.message };
  }

  revalidatePath("/dashboard");
  redirect(`/projects/${project.id}`);
}

export async function updateTaskStatusAction(formData: FormData) {
  const user = await requireUser();
  const supabase = await requireSupabase();
  const taskId = String(formData.get("taskId") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!supabase || !taskId || !projectId) {
    return;
  }

  const allowed = ["not_started", "in_progress", "blocked", "complete"];

  if (!allowed.includes(status)) {
    return;
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    return;
  }

  await supabase
    .from("project_tasks")
    .update({ status: status as TaskStatus })
    .eq("id", taskId)
    .eq("project_id", projectId);

  revalidatePath(`/projects/${projectId}/tasks`);
  revalidatePath(`/projects/${projectId}`);
}
