import { TaskBoard } from "@/components/projects/task-board";
import { PageHeader } from "@/components/workspace/primitives";
import { requireUser } from "@/lib/auth";
import { getProjectWorkspace } from "@/lib/data/projects";
export default async function TasksPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const user = await requireUser();
  const p = await getProjectWorkspace(projectId, user.id, "project_tasks");
  return (
    <div>
      <PageHeader
        eyebrow="One clear step at a time"
        title="Project plan"
        description="Know what needs doing, why it matters, and what comes first. Complete a task to update your project’s progress."
      />
      <TaskBoard projectId={projectId} tasks={p.project_tasks} />
    </div>
  );
}
