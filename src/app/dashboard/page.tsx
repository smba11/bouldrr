import Link from "next/link";
import { Plus, Settings } from "lucide-react";
import { signOutAction } from "@/lib/actions/auth";
import { requireUser } from "@/lib/auth";
import { getDashboardProjects } from "@/lib/data/projects";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardPage() {
  const user = await requireUser();
  const projects = await getDashboardProjects(user.id);

  return (
    <main className="min-h-screen bg-muted/20">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link className="font-semibold" href="/dashboard">
            Bouldrr
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost">
              <Link href="/settings">
                <Settings className="size-4" />
                Settings
              </Link>
            </Button>
            <form action={signOutAction}>
              <Button type="submit" variant="outline">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
            <p className="mt-1 text-muted-foreground">
              Create, review, and continue real-estate development workspaces.
            </p>
          </div>
          <Button asChild>
            <Link href="/projects/new">
              <Plus className="size-4" />
              New project
            </Link>
          </Button>
        </div>

        {projects.length === 0 ? (
          <Card className="mt-8 border-dashed shadow-sm">
            <CardContent className="flex min-h-72 flex-col items-center justify-center gap-4 text-center">
              <div>
                <h2 className="text-xl font-medium">Start your first project</h2>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  Add a property, describe the work, and Bouldrr will create a
                  structured development task list.
                </p>
              </div>
              <Button asChild>
                <Link href="/projects/new">Create project</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              const property = project.properties[0];
              return (
                <Link href={`/projects/${project.id}`} key={project.id}>
                  <Card className="h-full transition hover:border-foreground/40 hover:shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-base">{project.name}</CardTitle>
                      <CardDescription>{project.project_type}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      {property
                        ? `${property.address_line_1}, ${property.city}, ${property.state}`
                        : "No property attached"}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
