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
} from "@/lib/types";

export type DashboardProject = ProjectRecord & {
  properties: Pick<PropertyRecord, "address_line_1" | "city" | "state">[];
};

export type ProjectWorkspace = ProjectRecord & {
  properties: PropertyRecord[];
  project_tasks: ProjectTaskRecord[];
  documents: DocumentRecord[];
  project_costs: ProjectCostRecord[];
  project_milestones: ProjectMilestoneRecord[];
  project_messages: ProjectMessageRecord[];
};

export const getDashboardProjects = cache(async (userId: string) => {
  const supabase = await createClient();

  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("projects")
    .select("*, properties(address_line_1, city, state)")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  return (data ?? []) as DashboardProject[];
});

export const getProjectWorkspace = cache(
  async (projectId: string, userId: string) => {
    const supabase = await createClient();

    if (!supabase) {
      redirect("/dashboard");
    }

    const { data, error } = await supabase
      .from("projects")
      .select(
        "*, properties(*), project_tasks(*), documents(*), project_costs(*), project_milestones(*), project_messages(*)",
      )
      .eq("id", projectId)
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      notFound();
    }

    const workspace = data as ProjectWorkspace;

    workspace.project_tasks.sort((first, second) => {
      return first.sort_order - second.sort_order;
    });
    workspace.documents.sort((first, second) => {
      return (
        new Date(second.created_at).getTime() -
        new Date(first.created_at).getTime()
      );
    });
    workspace.project_costs.sort((first, second) => {
      return first.category.localeCompare(second.category);
    });
    workspace.project_milestones.sort((first, second) => {
      return first.sort_order - second.sort_order;
    });
    workspace.project_messages.sort((first, second) => {
      return (
        new Date(first.created_at).getTime() -
        new Date(second.created_at).getTime()
      );
    });

    return workspace;
  },
);

export const getRegulationExample = cache(async () => {
  const supabase = await createClient();

  if (!supabase) {
    return {
      regulations: [] as RegulationRecord[],
      sources: [] as RegulationSourceRecord[],
    };
  }

  const [{ data: regulations }, { data: sources }] = await Promise.all([
    supabase
      .from("regulations")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(3),
    supabase
      .from("regulation_sources")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(3),
  ]);

  return {
    regulations: (regulations ?? []) as RegulationRecord[],
    sources: (sources ?? []) as RegulationSourceRecord[],
  };
});
