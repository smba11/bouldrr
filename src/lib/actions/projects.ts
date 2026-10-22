"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  costCategories,
  starterTasks,
  taskStatusLabels,
} from "@/lib/constants";
import { requireUser, requireSupabase } from "@/lib/auth";
import type { Json, MilestoneStatus, TaskStatus } from "@/lib/types";

export type ProjectFormState = {
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

const projectSchema = z.object({
  projectType: z.string().trim().min(1, "Choose a project type.").max(80),
  addressLine1: z.string().trim().min(3, "Enter a street address.").max(250),
  city: z.string().trim().min(2, "Enter a city.").max(120),
  state: z.string().trim().min(2, "Enter a state.").max(120),
  postalCode: z.string().trim().min(3, "Enter a ZIP or postal code.").max(30),
  county: z.string().max(120).optional(),
  description: z
    .string()
    .trim()
    .min(8, "Describe what you want to do.")
    .max(5000),
  formattedAddress: z.string().optional(),
  googlePlaceId: z.string().optional(),
  latitude: z.preprocess(
    (value) =>
      value === "" || value === null || value === undefined
        ? null
        : Number(value),
    z.number().finite().min(-90).max(90).nullable(),
  ),
  longitude: z.preprocess(
    (value) =>
      value === "" || value === null || value === undefined
        ? null
        : Number(value),
    z.number().finite().min(-180).max(180).nullable(),
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

export async function createProjectAction(
  _state: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const fields = Object.fromEntries(formData);
  const parsed = projectSchema.safeParse(fields);
  if (!parsed.success)
    return {
      errors: parsed.error.flatten().fieldErrors,
      message: "Please review the property details and goal.",
    };
  const user = await requireUser();
  const supabase = await requireSupabase();
  if (!supabase)
    return {
      message: "Your workspace connection is unavailable. Please try again.",
    };
  const tasks = [
    ...starterTasks,
    {
      category: "Site Analysis",
      title: "Document site access and constraints",
      description: "Record what is known before placing a building concept.",
      instructions:
        "Collect a survey, note road access and utilities, and ask the local authority about flood, wetlands, easements, and slope. Mark all unknowns.",
      priority: "high",
      sortOrder: 25,
      documentsNeeded: ["Survey", "Utility records"],
    },
    {
      category: "Pre-Construction",
      title: "Confirm approvals before starting work",
      description:
        "Avoid starting work before required approvals and insurance are in place.",
      instructions:
        "Check approved plans, permits, contractor scope, insurance, and site safety arrangements with your project team.",
      priority: "high",
      sortOrder: 55,
    },
  ].sort((a, b) => a.sortOrder - b.sortOrder);
  const input = {
    ...parsed.data,
    addressLine1: parsed.data.addressLine1.trim(),
    city: parsed.data.city.trim(),
    state: parsed.data.state.trim(),
    userId: user.id,
  };
  const { data: id, error } = await supabase.rpc("create_project_workspace", {
    input: input as unknown as Json,
    tasks: tasks.map((task, index) => ({
      ...task,
      dependencyIndex: index > 0 ? index - 1 : null,
    })) as unknown as Json,
  });
  if (error || !id)
    return {
      message:
        "We couldn’t create your workspace. Nothing was partially saved. Please try again.",
    };
  revalidatePath("/dashboard");
  redirect(`/projects/${id}`);
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
    throw new Error("Review your changes and try again.");
  }

  const { supabase, project } = await getOwnedProject(parsed.data.projectId);

  if (!supabase || !project) {
    throw new Error("Review your changes and try again.");
  }

  const { error: mutationError } = await supabase.from("project_costs").insert({
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

  if (mutationError) throw new Error("Your changes couldn’t be saved.");
  revalidatePath(`/projects/${parsed.data.projectId}/costs`);
  revalidatePath(`/projects/${parsed.data.projectId}`);
}

export async function deleteCostAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const costId = String(formData.get("costId") ?? "");

  if (!projectId || !costId) {
    throw new Error("Review your changes and try again.");
  }

  const { supabase, project } = await getOwnedProject(projectId);

  if (!supabase || !project) {
    throw new Error("Review your changes and try again.");
  }

  const { error: mutationError } = await supabase
    .from("project_costs")
    .delete()
    .eq("id", costId)
    .eq("project_id", projectId);

  if (mutationError) throw new Error("Your changes couldn’t be saved.");
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
    throw new Error("Review your changes and try again.");
  }

  const { supabase, project } = await getOwnedProject(parsed.data.projectId);

  if (!supabase || !project) {
    throw new Error("Review your changes and try again.");
  }

  const { count } = await supabase
    .from("project_milestones")
    .select("id", { count: "exact", head: true })
    .eq("project_id", parsed.data.projectId);

  const { error: mutationError } = await supabase
    .from("project_milestones")
    .insert({
      project_id: parsed.data.projectId,
      phase: parsed.data.phase,
      title: parsed.data.title,
      status: "not_started",
      due_date: parsed.data.dueDate || null,
      completed_at: null,
      sort_order: (count ?? 0) * 10 + 10,
      notes: parsed.data.notes?.trim() || null,
    });

  if (mutationError) throw new Error("Your changes couldn’t be saved.");
  revalidatePath(`/projects/${parsed.data.projectId}/timeline`);
  revalidatePath(`/projects/${parsed.data.projectId}`);
}

export async function updateMilestoneStatusAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const milestoneId = String(formData.get("milestoneId") ?? "");
  const status = String(formData.get("status") ?? "");
  const allowed = ["not_started", "in_progress", "blocked", "complete"];

  if (!projectId || !milestoneId || !allowed.includes(status)) {
    throw new Error("Review your changes and try again.");
  }

  const { supabase, project } = await getOwnedProject(projectId);

  if (!supabase || !project) {
    throw new Error("Review your changes and try again.");
  }

  const { error: mutationError } = await supabase
    .from("project_milestones")
    .update({
      status: status as MilestoneStatus,
      completed_at:
        status === "complete" ? new Date().toISOString().slice(0, 10) : null,
    })
    .eq("id", milestoneId)
    .eq("project_id", projectId);

  if (mutationError) throw new Error("Your changes couldn’t be saved.");
  revalidatePath(`/projects/${projectId}/timeline`);
  revalidatePath(`/projects/${projectId}`);
}

export async function deleteMilestoneAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const milestoneId = String(formData.get("milestoneId") ?? "");

  if (!projectId || !milestoneId) {
    throw new Error("Review your changes and try again.");
  }

  const { supabase, project } = await getOwnedProject(projectId);

  if (!supabase || !project) {
    throw new Error("Review your changes and try again.");
  }

  const { error: mutationError } = await supabase
    .from("project_milestones")
    .delete()
    .eq("id", milestoneId)
    .eq("project_id", projectId);

  if (mutationError) throw new Error("Your changes couldn’t be saved.");
  revalidatePath(`/projects/${projectId}/timeline`);
  revalidatePath(`/projects/${projectId}`);
}

export type TaskFormState = { error?: string; success?: boolean };
export async function saveTaskAction(
  _state: TaskFormState,
  formData: FormData,
): Promise<TaskFormState> {
  const schema = z.object({
    projectId: z.string().uuid(),
    taskId: z.string().uuid(),
    status: z.enum(
      Object.keys(taskStatusLabels) as [TaskStatus, ...TaskStatus[]],
    ),
    priority: z.enum(["low", "medium", "high"]),
    dueDate: z.union([z.literal(""), z.iso.date()]),
    notes: z.string().max(10000),
    sourceUrl: z.union([
      z.literal(""),
      z.url().refine((v) => /^https?:\/\//.test(v)),
    ]),
    dependsOn: z.union([z.literal(""), z.string().uuid()]),
  });
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { error: "Review the date, dependency, and source URL (https://)." };
  const { supabase, project } = await getOwnedProject(parsed.data.projectId);
  if (!supabase || !project) return { error: "This project is unavailable." };
  const v = parsed.data;
  const { data: tasks, error: readError } = await supabase
    .from("project_tasks")
    .select("id,depends_on_id")
    .eq("project_id", project.id);
  if (readError || !tasks?.some((t) => t.id === v.taskId))
    return { error: "This task couldn’t be found." };
  let next = v.dependsOn;
  const visited = new Set([v.taskId]);
  while (next) {
    if (visited.has(next))
      return { error: "That dependency would create a cycle." };
    visited.add(next);
    const predecessor = tasks.find((t) => t.id === next);
    if (!predecessor)
      return { error: "Choose a dependency from this project." };
    next = predecessor.depends_on_id ?? "";
  }
  const { error } = await supabase
    .from("project_tasks")
    .update({
      status: v.status,
      priority: v.priority,
      due_date: v.dueDate || null,
      notes: v.notes || null,
      source_url: v.sourceUrl || null,
      depends_on_id: v.dependsOn || null,
    })
    .eq("id", v.taskId)
    .eq("project_id", project.id);
  if (error) return { error: "Your task couldn’t be saved. Please try again." };
  revalidatePath(`/projects/${project.id}`, "layout");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function toggleTaskAction(
  projectId: string,
  taskId: string,
  complete: boolean,
): Promise<{ error?: string }> {
  if (
    !z.string().uuid().safeParse(projectId).success ||
    !z.string().uuid().safeParse(taskId).success
  )
    return { error: "This task is unavailable." };
  const { supabase, project } = await getOwnedProject(projectId);
  if (!supabase || !project) return { error: "This project is unavailable." };
  const { data, error } = await supabase
    .from("project_tasks")
    .update({ status: complete ? "complete" : "not_started" })
    .eq("id", taskId)
    .eq("project_id", projectId)
    .select("id");
  if (error || !data?.length)
    return { error: "We couldn’t update this task. Try again." };
  revalidatePath(`/projects/${projectId}`, "layout");
  return {};
}
export async function addTaskAction(
  _state: TaskFormState,
  form: FormData,
): Promise<TaskFormState> {
  const parsed = z
    .object({
      projectId: z.string().uuid(),
      title: z.string().trim().min(3).max(250),
      category: z.string().min(2).max(80),
      description: z.string().max(5000),
      instructions: z.string().max(10000),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return { error: "Give this task a title of at least three characters." };
  const v = parsed.data;
  const { supabase, project } = await getOwnedProject(v.projectId);
  if (!supabase || !project) return { error: "This project is unavailable." };
  const { error } = await supabase.from("project_tasks").insert({
    project_id: project.id,
    title: v.title,
    category: v.category,
    description: v.description || null,
    instructions: v.instructions || null,
    status: "not_started",
    priority: "medium",
    sort_order: Date.now() % 100000000,
    parent_task_id: null,
    depends_on_id: null,
    due_date: null,
    regulation_source_id: null,
    local_authority: null,
    documents_needed: [],
    fee_estimate: null,
    processing_time: null,
    dependency_notes: null,
    assigned_to: null,
    notes: null,
    source_url: null,
  });
  if (error) return { error: "We couldn’t add the task. Try again." };
  revalidatePath(`/projects/${project.id}`, "layout");
  return { success: true };
}
