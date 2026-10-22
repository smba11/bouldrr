import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth";
import { getDashboardProjects, getProjectShell } from "@/lib/data/projects";
import { WorkspaceShell } from "@/components/workspace/shell";
export default async function ProjectLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const user = await requireUser();
  const [project, projects] = await Promise.all([
    getProjectShell(projectId, user.id),
    getDashboardProjects(user.id),
  ]);
  return (
    <WorkspaceShell project={project} projects={projects}>
      {children}
    </WorkspaceShell>
  );
}
