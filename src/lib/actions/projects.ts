"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { costCategories, starterTasks, taskStatusLabels } from "@/lib/constants";
import { requireUser, requireSupabase } from "@/lib/auth";
import type { MilestoneStatus, TaskStatus } from "@/lib/types";

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
  county: z.string().optional(),
  description: z.string().min(8, "Describe what you want to do."),
  formattedAddress: z.string().optional(),
  googlePlaceId: z.string().optional(),
  latitude: z.preprocess(
    (value) =>
      value === "" || value === null || value === undefined
        ? null
        : Number(value),
    z.number().finite().nullable(),
  ),
  longitude: z.preprocess(
    (value) =>
      value === "" || value === null || value === undefined
        ? null
        : Number(value),
    z.number().finite().nullable(),
  ),
});

const costSchema = z.object({
  projectId: z.string().uuid(),
  category: z.enum(costCategories),
  itemName: z.string().min(2),
  estimatedAmount: z.coerce.number().min(0).default(0),
  quotedAmount: z.coerce.number().min(0).default(0),
  committedAmount: z.coerce.number().min(0).default(0),
  paidAmount: z.coerce.number().min(0).default(0),
  finalAmount: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
});

const milestoneSchema = z.object({
  projectId: z.string().uuid(),
  phase: z.string().min(2),
  title: z.string().min(2),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
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
    county: formData.get("county"),
    description: formData.get("description"),
    formattedAddress: formData.get("formattedAddress"),
    googlePlaceId: formData.get("googlePlaceId"),
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
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
    county: parsed.data.county?.trim() || null,
    address_line_2: null,
    latitude: parsed.data.latitude,
    longitude: parsed.data.longitude,
    parcel_number: null,
    google_place_id: parsed.data.googlePlaceId?.trim() || null,
    formatted_address: parsed.data.formattedAddress?.trim() || null,
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
      local_authority: task.localAuthority ?? null,
      documents_needed: task.documentsNeeded ?? [],
      fee_estimate: null,
      processing_time: task.processingTime ?? null,
      dependency_notes: task.dependencyNotes ?? null,
      assigned_to: null,
      notes: null,
      source_url: null,
      sort_order: task.sortOrder,
    })),
  );

  if (tasksError) {
    return { message: tasksError.message };
  }

  revalidatePath("/dashboard");
  redirect(`/projects/${project.id}`);
}

async function getOwnedProject(projectId: string) {
  const user = await requireUser();
  const supabase = await requireSupabase();

  if (!supabase) {
    return { supabase: null, project: null, user };
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  return { supabase, project, user };
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

  const allowed = Object.keys(taskStatusLabels);

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

export async function updateTaskDetailsAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const taskId = String(formData.get("taskId") ?? "");
  const assignedTo = String(formData.get("assignedTo") ?? "").trim();
  const dueDate = String(formData.get("dueDate") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const sourceUrl = String(formData.get("sourceUrl") ?? "").trim();

  if (!projectId || !taskId) {
    return;
  }

  const { supabase, project } = await getOwnedProject(projectId);

  if (!supabase || !project) {
    return;
  }

  await supabase
    .from("project_tasks")
    .update({
      assigned_to: assignedTo || null,
      due_date: dueDate || null,
      notes: notes || null,
      source_url: sourceUrl || null,
    })
    .eq("id", taskId)
    .eq("project_id", projectId);

  revalidatePath(`/projects/${projectId}/tasks`);
  revalidatePath(`/projects/${projectId}`);
}

export async function createCostAction(formData: FormData) {
  const parsed = costSchema.safeParse({
    projectId: formData.get("projectId"),
    category: formData.get("category"),
    itemName: formData.get("itemName"),
    estimatedAmount: formData.get("estimatedAmount") || 0,
    quotedAmount: formData.get("quotedAmount") || 0,
    committedAmount: formData.get("committedAmount") || 0,
    paidAmount: formData.get("paidAmount") || 0,
    finalAmount: formData.get("finalAmount") || 0,
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return;
  }

  const { supabase, project } = await getOwnedProject(parsed.data.projectId);

  if (!supabase || !project) {
    return;
  }

  await supabase.from("project_costs").insert({
    project_id: parsed.data.projectId,
    category: parsed.data.category,
    item_name: parsed.data.itemName,
    estimated_amount: parsed.data.estimatedAmount,
    quoted_amount: parsed.data.quotedAmount,
    committed_amount: parsed.data.committedAmount,
    paid_amount: parsed.data.paidAmount,
    final_amount: parsed.data.finalAmount,
    notes: parsed.data.notes?.trim() || null,
  });

  revalidatePath(`/projects/${parsed.data.projectId}/costs`);
  revalidatePath(`/projects/${parsed.data.projectId}`);
}

export async function deleteCostAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const costId = String(formData.get("costId") ?? "");

  if (!projectId || !costId) {
    return;
  }

  const { supabase, project } = await getOwnedProject(projectId);

  if (!supabase || !project) {
    return;
  }

  await supabase
    .from("project_costs")
    .delete()
    .eq("id", costId)
    .eq("project_id", projectId);

  revalidatePath(`/projects/${projectId}/costs`);
  revalidatePath(`/projects/${projectId}`);
}

export async function createMilestoneAction(formData: FormData) {
  const parsed = milestoneSchema.safeParse({
    projectId: formData.get("projectId"),
    phase: formData.get("phase"),
    title: formData.get("title"),
    dueDate: formData.get("dueDate"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return;
  }

  const { supabase, project } = await getOwnedProject(parsed.data.projectId);

  if (!supabase || !project) {
    return;
  }

  const { count } = await supabase
    .from("project_milestones")
    .select("id", { count: "exact", head: true })
    .eq("project_id", parsed.data.projectId);

  await supabase.from("project_milestones").insert({
    project_id: parsed.data.projectId,
    phase: parsed.data.phase,
    title: parsed.data.title,
    status: "not_started",
    due_date: parsed.data.dueDate || null,
    completed_at: null,
    sort_order: (count ?? 0) * 10 + 10,
    notes: parsed.data.notes?.trim() || null,
  });

  revalidatePath(`/projects/${parsed.data.projectId}/timeline`);
  revalidatePath(`/projects/${parsed.data.projectId}`);
}

export async function updateMilestoneStatusAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const milestoneId = String(formData.get("milestoneId") ?? "");
  const status = String(formData.get("status") ?? "");
  const allowed = ["not_started", "in_progress", "blocked", "complete"];

  if (!projectId || !milestoneId || !allowed.includes(status)) {
    return;
  }

  const { supabase, project } = await getOwnedProject(projectId);

  if (!supabase || !project) {
    return;
  }

  await supabase
    .from("project_milestones")
    .update({
      status: status as MilestoneStatus,
      completed_at:
        status === "complete" ? new Date().toISOString().slice(0, 10) : null,
    })
    .eq("id", milestoneId)
    .eq("project_id", projectId);

  revalidatePath(`/projects/${projectId}/timeline`);
  revalidatePath(`/projects/${projectId}`);
}

export async function deleteMilestoneAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const milestoneId = String(formData.get("milestoneId") ?? "");

  if (!projectId || !milestoneId) {
    return;
  }

  const { supabase, project } = await getOwnedProject(projectId);

  if (!supabase || !project) {
    return;
  }

  await supabase
    .from("project_milestones")
    .delete()
    .eq("id", milestoneId)
    .eq("project_id", projectId);

  revalidatePath(`/projects/${projectId}/timeline`);
  revalidatePath(`/projects/${projectId}`);
}
