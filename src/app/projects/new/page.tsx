import { NewProjectForm } from "@/components/projects/new-project-form";
import { requireUser } from "@/lib/auth";

export default async function NewProjectPage() {
  await requireUser();

  return (
    <main className="min-h-screen bg-muted/20 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <NewProjectForm />
      </div>
    </main>
  );
}
