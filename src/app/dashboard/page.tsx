import Link from "next/link";
import { ArrowUpRight, Plus, MapPin } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getDashboardProjects } from "@/lib/data/projects";
import { WorkspaceShell } from "@/components/workspace/shell";
import {
  PageHeader,
  EmptyState,
  StatusBadge,
} from "@/components/workspace/primitives";
export default async function DashboardPage() {
  const user = await requireUser();
  const projects = await getDashboardProjects(user.id);
  return (
    <WorkspaceShell projects={projects}>
      <PageHeader
        eyebrow="Your workspace"
        title="Good things start here."
        description="A home for your properties, plans, and next possibilities."
        action={
          <Link className="button-primary" href="/projects/new">
            <Plus className="size-4" />
            New project
          </Link>
        }
      />
      <div className="mb-7 flex items-center justify-between border-b pb-4">
        <h2 className="text-sm font-medium">
          Your projects{" "}
          <span className="ml-2 text-muted-foreground">{projects.length}</span>
        </h2>
        <p className="text-[10px] text-muted-foreground">
          Most recently updated first
        </p>
      </div>
      {projects.length ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => (
            <Link
              href={`/projects/${p.id}`}
              key={p.id}
              className="property-card"
            >
              <div className="property-art">
                <span className="absolute left-4 top-3 z-10">
                  <StatusBadge status={p.status} />
                </span>
                <span className="absolute bottom-3 left-4 z-10 text-[9px] text-muted-foreground">
                  PROPERTY WORKSPACE
                </span>
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold leading-6">{p.name}</h3>
                  <ArrowUpRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {p.project_type}
                </p>
                <div className="mt-5 flex items-center gap-2 border-t pt-4 text-xs text-muted-foreground">
                  <MapPin className="size-3.5" />
                  {p.properties[0]
                    ? [p.properties[0].city, p.properties[0].state].join(", ")
                    : "Property details needed"}
                </div>
              </div>
            </Link>
          ))}
          <Link
            className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed text-sm text-muted-foreground transition hover:border-primary hover:text-primary"
            href="/projects/new"
          >
            <Plus className="size-6 stroke-[1.3]" />
            Make room for another idea
          </Link>
        </div>
      ) : (
        <EmptyState
          title="Your next possibility starts with a property."
          description="Find an address, describe your goal, and create a private workspace with a practical development checklist."
          action={
            <Link className="button-primary" href="/projects/new">
              Find a property <ArrowUpRight className="size-4" />
            </Link>
          }
        />
      )}
      <p className="mt-8 max-w-lg text-xs leading-6 text-muted-foreground">
        A clear plan starts with clear facts. Bouldrr labels what’s known, what
        you’ve provided, and what still needs verification.
      </p>
    </WorkspaceShell>
  );
}
