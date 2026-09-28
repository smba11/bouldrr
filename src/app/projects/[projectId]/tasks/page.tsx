import { TaskBoard } from "@/components/projects/task-board";
import { requireUser } from "@/lib/auth";
import { getProjectWorkspace } from "@/lib/data/projects";

export default async function TasksPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const user = await requireUser();
  const project = await getProjectWorkspace(projectId, user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Project Plan</h1>
        <p className="mt-2 text-muted-foreground">
          Tasks start as a general development checklist and can become
          jurisdiction-specific as official sources are attached.
        </p>
      </div>
      <TaskBoard projectId={project.id} tasks={project.project_tasks} />
    </div>
  );
}
