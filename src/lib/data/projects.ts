import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type {
  DocumentRecord,
  ProjectCostRecord,
  ProjectMilestoneRecord,
  ProjectMessageRecord,
  ProjectRecord,
  ProjectTaskRecord,
  PropertyRecord,
  RegulationRecord,
  RegulationSourceRecord,
  Database,
} from "@/lib/types";
import { defaultConcept } from "@/lib/site-design";
import {
  conceptSchema,
  mapFeatureSchema,
  displayFeatureSchema,
} from "@/lib/validation/site-design";

export type DashboardProject = ProjectRecord & {
  properties: Pick<PropertyRecord, "address_line_1" | "city" | "state">[];
};
export type ProjectShell = ProjectRecord & { properties: PropertyRecord[] };
export type ProjectWorkspace = ProjectShell & {
  project_tasks: ProjectTaskRecord[];
  documents: DocumentRecord[];
  project_costs: ProjectCostRecord[];
  project_milestones: ProjectMilestoneRecord[];
  project_messages: ProjectMessageRecord[];
};
export const getDashboardProjects = cache(async (userId: string) => {
  const db = await createClient();
  if (!db) return [];
  const { data, error } = await db
    .from("projects")
    .select("*, properties(address_line_1,city,state)")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error)
    throw new Error("Your projects couldn’t be loaded. Please try again.");
  return (data ?? []) as DashboardProject[];
});
export const getProjectShell = cache(async (id: string, userId: string) => {
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = await createClient();
  if (!db) redirect("/dashboard");
  const { data, error } = await db
    .from("projects")
    .select("*, properties(*)")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (error)
    throw new Error("This workspace couldn’t be loaded. Please try again.");
  if (!data) notFound();
  return data as ProjectShell;
});
export const getProjectWorkspace = cache(
  async (
    id: string,
    userId: string,
    view = "overview",
  ): Promise<ProjectWorkspace> => {
    const project = await getProjectShell(id, userId);
    const db = await createClient();
    if (!db) redirect("/dashboard");
    const workspace: ProjectWorkspace = {
      ...project,
      project_tasks: [],
      documents: [],
      project_costs: [],
      project_milestones: [],
      project_messages: [],
    };
    const requested =
      view === "copilot"
        ? [
            "project_tasks",
            "documents",
            "project_costs",
            "project_milestones",
            "project_messages",
          ]
        : view === "overview"
          ? ["project_tasks", "documents", "project_milestones"]
          : view === "feasibility"
            ? ["project_tasks"]
            : [view];
    await Promise.all(
      requested.map(async (relation) => {
        if (relation === "project_tasks") {
          const r = await db
            .from("project_tasks")
            .select("*")
            .eq("project_id", id)
            .order("sort_order");
          if (r.error) throw new Error("Tasks couldn’t be loaded.");
          workspace.project_tasks = r.data;
        }
        if (relation === "documents") {
          const r = await db
            .from("documents")
            .select("*")
            .eq("project_id", id)
            .order("created_at", { ascending: false })
            .limit(view === "overview" ? 5 : 500);
          if (r.error) throw new Error("Documents couldn’t be loaded.");
          workspace.documents = r.data;
        }
        if (relation === "project_costs") {
          const r = await db
            .from("project_costs")
            .select("*")
            .eq("project_id", id)
            .order("category");
          if (r.error) throw new Error("Costs couldn’t be loaded.");
          workspace.project_costs = r.data;
        }
        if (relation === "project_milestones") {
          const r = await db
            .from("project_milestones")
            .select("*")
            .eq("project_id", id)
            .order("sort_order");
          if (r.error) throw new Error("Timeline couldn’t be loaded.");
          workspace.project_milestones = r.data;
        }
        if (relation === "project_messages") {
          const r = await db
            .from("project_messages")
            .select("*")
            .eq("project_id", id)
            .order("created_at", { ascending: false })
            .limit(50);
          if (r.error) throw new Error("Conversation couldn’t be loaded.");
          workspace.project_messages = r.data.reverse();
        }
      }),
    );
    return workspace;
  },
);
export const getProjectRegulations = cache(
  async (projectId: string, userId: string) => {
    const p = await getProjectShell(projectId, userId);
    const jurisdictionId = p.properties[0]?.jurisdiction_id;
    if (!jurisdictionId)
      return {
        regulations: [] as RegulationRecord[],
        sources: [] as RegulationSourceRecord[],
      };
    const db = await createClient();
    if (!db)
      return {
        regulations: [] as RegulationRecord[],
        sources: [] as RegulationSourceRecord[],
      };
    const [rules, sources] = await Promise.all([
      db.from("regulations").select("*").eq("jurisdiction_id", jurisdictionId),
      db
        .from("regulation_sources")
        .select("*")
        .eq("jurisdiction_id", jurisdictionId),
    ]);
    if (rules.error || sources.error)
      throw new Error("Local sources couldn’t be loaded.");
    return { regulations: rules.data, sources: sources.data };
  },
);
export const getSiteDesign = cache(
  async (projectId: string, userId: string) => {
    await getProjectShell(projectId, userId);
    const db = await createClient();
    if (!db) throw new Error("Workspace unavailable.");
    const [design, features] = await Promise.all([
      db
        .from("site_designs")
        .select("*")
        .eq("project_id", projectId)
        .maybeSingle(),
      db
        .from("map_features")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at"),
    ]);
    if (design.error || features.error)
      throw new Error("Your site plan couldn’t be loaded. Please try again.");
    const parsed = conceptSchema.safeParse(design.data?.configuration);
    return {
      revision: design.data?.revision ?? 0,
      configuration: parsed.success ? parsed.data : defaultConcept,
      sourceFeatures: (features.data ?? [])
        .filter((f) => f.provenance !== "user")
        .map((f) => displayFeatureSchema.parse(f)),
      features: (features.data ?? [])
        .filter((f) => f.provenance === "user")
        .map((f) => mapFeatureSchema.parse(f)),
    };
  },
);
export const getProjectActivity = cache(
  async (projectId: string, userId: string) => {
    await getProjectShell(projectId, userId);
    const db = await createClient();
    if (!db)
      return [] as Database["public"]["Tables"]["project_activity"]["Row"][];
    const { data, error } = await db
      .from("project_activity")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(12);
    if (error) throw new Error("Activity couldn’t be loaded.");
    return data ?? [];
  },
);
