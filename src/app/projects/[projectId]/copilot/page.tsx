import { CopilotPanel } from "@/components/projects/copilot-panel";
import { requireUser } from "@/lib/auth";
import { getProjectWorkspace } from "@/lib/data/projects";

export default async function CopilotPage({
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
        <h1 className="text-3xl font-semibold tracking-tight">Copilot</h1>
        <p className="mt-2 text-muted-foreground">
          Ask questions with project context. AI stays disabled until
          OPENAI_API_KEY is added server-side.
        </p>
      </div>
      <CopilotPanel
        initialMessages={project.project_messages}
        projectId={project.id}
      />
    </div>
  );
}
