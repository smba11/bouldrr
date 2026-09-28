import { DocumentManager } from "@/components/documents/document-manager";
import { requireUser } from "@/lib/auth";
import { getProjectWorkspace } from "@/lib/data/projects";

export default async function DocumentsPage({
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
        <h1 className="text-3xl font-semibold tracking-tight">Documents</h1>
        <p className="mt-2 text-muted-foreground">
          Upload project documents into Supabase Storage and label them for later review.
        </p>
      </div>
      <DocumentManager documents={project.documents} projectId={project.id} />
    </div>
  );
}
