import { DocumentManager } from "@/components/documents/document-manager";
import { PageHeader } from "@/components/workspace/primitives";
import { requireUser } from "@/lib/auth";
import { getProjectWorkspace } from "@/lib/data/projects";
export default async function DocumentsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const user = await requireUser();
  const p = await getProjectWorkspace(projectId, user.id, "documents");
  return (
    <div>
      <PageHeader
        eyebrow="The details, all together"
        title="Project documents"
        description="Surveys, plans, approvals, and the records behind your decisions. Kept privately with your project."
      />
      <DocumentManager projectId={projectId} documents={p.documents} />
    </div>
  );
}
