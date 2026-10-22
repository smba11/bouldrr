import { NewProjectForm } from "@/components/projects/new-project-form";
import { requireUser } from "@/lib/auth";
export default async function NewProjectPage() {
  await requireUser();
  return (
    <main id="main-content" className="min-h-screen px-4 py-7 sm:px-8 sm:py-10">
      <NewProjectForm />
    </main>
  );
}
