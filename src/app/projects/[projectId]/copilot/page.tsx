import { CopilotPanel } from "@/components/projects/copilot-panel";
import { PageHeader } from "@/components/workspace/primitives";
import { requireUser } from "@/lib/auth";
import { isOpenAIEnabled } from "@/lib/env";
import {
  getProjectWorkspace,
  getProjectRegulations,
} from "@/lib/data/projects";
export default async function CopilotPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const user = await requireUser();
  const [p, { sources }] = await Promise.all([
    getProjectWorkspace(projectId, user.id, "copilot"),
    getProjectRegulations(projectId, user.id),
  ]);
  const property = p.properties[0];
  return (
    <div>
      <PageHeader
        eyebrow="A project-aware perspective"
        title="Bouldrr Copilot"
        description="Your property, your goal, and the context you’ve collected—ready for the next question."
      />
      <CopilotPanel
        projectId={projectId}
        initialMessages={p.project_messages}
        enabled={isOpenAIEnabled()}
        projectName={p.name}
        context={{
          tasks: p.project_tasks.length,
          documents: p.documents.length,
          sources: sources.length,
          jurisdiction:
            [property?.city, property?.county, property?.state]
              .filter(Boolean)
              .join(", ") || "Not yet available",
        }}
      />
    </div>
  );
}
