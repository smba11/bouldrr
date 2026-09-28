import type { ReactNode } from "react";
import {
  MobileProjectNav,
  ProjectSidebar,
} from "@/components/projects/project-sidebar";
import { requireUser } from "@/lib/auth";
import { getProjectWorkspace } from "@/lib/data/projects";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const user = await requireUser();
  const project = await getProjectWorkspace(projectId, user.id);

  return (
    <div className="flex min-h-screen bg-background">
      <ProjectSidebar project={project} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileProjectNav project={project} />
        <main className="flex-1 p-5 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
