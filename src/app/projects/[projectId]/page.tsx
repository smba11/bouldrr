import Link from "next/link";
import { ArrowRight, ArrowUpRight, Flag, MapPin } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getProjectWorkspace, getProjectActivity } from "@/lib/data/projects";
import {
  PageHeader,
  SectionHeader,
  StatusBadge,
  SourceBadge,
  TaskRow,
} from "@/components/workspace/primitives";
import { OverviewMap } from "@/components/maps/overview-map";
import { formatDate } from "@/lib/format";
export default async function Overview({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const user = await requireUser();
  const [project, activity] = await Promise.all([
    getProjectWorkspace(projectId, user.id),
    getProjectActivity(projectId, user.id),
  ]);
  const p = project.properties[0],
    tasks = project.project_tasks;
  const done = tasks.filter((t) => t.status === "complete").length;
  const progress = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const blockers = tasks.filter((t) => t.status === "blocked");
  const next = tasks
    .filter((t) => t.status !== "complete" && t.status !== "approved")
    .sort(
      (a, b) =>
        Number(b.priority === "high") - Number(a.priority === "high") ||
        a.sort_order - b.sort_order,
    )
    .slice(0, 5);
  const milestones = project.project_milestones
    .filter((m) => m.status !== "complete")
    .slice(0, 4);
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Your project, from the ground up"
        title={p?.address_line_1 ?? project.name}
        description={project.description}
        action={
          <Link
            className="button-primary"
            href={`/projects/${projectId}/property?mode=design`}
          >
            Explore site concept
            <ArrowUpRight className="size-4" />
          </Link>
        }
      />
      <section className="flex flex-wrap items-center gap-6 rounded-xl border bg-white p-5">
        <div className="min-w-36">
          <p className="mb-2 text-xs text-muted-foreground">
            {project.project_type}
          </p>
          <StatusBadge status={project.status} />
        </div>
        <div className="min-w-40 flex-1 border-l pl-6">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Project checklist</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <progress
            className="h-1.5 w-full accent-primary"
            value={progress}
            max={100}
            aria-label="Project checklist completion"
          />
          <p className="mt-2 text-[10px] text-muted-foreground">
            {done} of {tasks.length} tasks complete
          </p>
        </div>
        <div className="min-w-24 border-l pl-6">
          <p className="text-xs text-muted-foreground">Active blockers</p>
          <p
            className={`mt-2 text-xl font-medium ${blockers.length ? "text-destructive" : ""}`}
          >
            {blockers.length}
          </p>
        </div>
      </section>
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,1fr)]">
        <div className="min-w-0 space-y-8">
          <section>
            <SectionHeader
              title="Your next moves"
              detail="A general development checklist. Verify requirements locally."
              action={
                <Link
                  className="text-xs text-primary"
                  href={`/projects/${projectId}/tasks`}
                >
                  All tasks <ArrowRight className="inline size-3" />
                </Link>
              }
            />
            {next.length ? (
              next.map((t) => (
                <TaskRow
                  key={t.id}
                  title={t.title}
                  category={t.category}
                  href={`/projects/${projectId}/tasks#task-${t.id}`}
                >
                  <StatusBadge status={t.status} />
                </TaskRow>
              ))
            ) : (
              <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                {tasks.length
                  ? "Your checklist is complete. Confirm official approvals and keep final records in Documents."
                  : "No tasks yet. Open Tasks to add the next steps for this project."}
              </p>
            )}
          </section>
          <section>
            <SectionHeader title="What needs a closer look" />
            <div className="rounded-xl border bg-[#edf1e6] p-5">
              <SourceBadge type="unknown" />
              <h3 className="mt-4 text-sm font-medium">
                The address is a start. The facts still need checking.
              </h3>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                Parcel boundaries, zoning, setbacks, environmental constraints,
                and the permit path have not been verified. Start with a survey
                and official planning sources.
              </p>
              <Link
                href={`/projects/${projectId}/feasibility`}
                className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-primary"
              >
                Review information gaps
                <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
            {blockers.map((t) => (
              <div
                className="mt-3 flex gap-3 rounded-lg border border-red-100 bg-red-50/40 p-4"
                key={t.id}
              >
                <Flag className="size-4 shrink-0 text-destructive" />
                <div>
                  <p className="text-xs font-medium">{t.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t.notes || t.description}
                  </p>
                </div>
              </div>
            ))}
          </section>
          <section>
            <SectionHeader
              title="Recent documents"
              action={
                <Link
                  className="text-xs text-primary"
                  href={`/projects/${projectId}/documents`}
                >
                  Open documents <ArrowUpRight className="inline size-3" />
                </Link>
              }
            />
            {project.documents.length ? (
              project.documents.slice(0, 4).map((d) => (
                <div
                  className="flex justify-between gap-3 border-b py-3 text-xs"
                  key={d.id}
                >
                  <Link
                    className="truncate hover:underline"
                    href={`/projects/${projectId}/documents`}
                  >
                    {d.name}
                  </Link>
                  <span className="shrink-0 text-muted-foreground">
                    {d.document_type}
                  </span>
                </div>
              ))
            ) : (
              <Link
                className="block rounded-xl border border-dashed p-5 text-xs leading-6 text-muted-foreground"
                href={`/projects/${projectId}/documents`}
              >
                Start with the source documents.
                <br />
                Upload a survey, plan, estimate, or property record{" "}
                <ArrowUpRight className="inline size-3" />
              </Link>
            )}
          </section>
        </div>
        <aside className="min-w-0 space-y-7">
          <section>
            <SectionHeader title="The property" />
            <OverviewMap
              address={
                p?.formatted_address ?? p?.address_line_1 ?? project.name
              }
              latitude={p?.latitude ?? null}
              longitude={p?.longitude ?? null}
            />
            <p className="mt-3 flex items-start gap-2 text-xs">
              <MapPin className="size-3.5 shrink-0 text-primary" />
              {[p?.city, p?.county, p?.state].filter(Boolean).join(" · ") ||
                "Jurisdiction not yet available"}
            </p>
            <p className="mt-2 text-[10px] text-muted-foreground">
              Address context · authority not yet confirmed
            </p>
          </section>
          <section>
            <SectionHeader
              title="On the horizon"
              action={
                <Link
                  href={`/projects/${projectId}/timeline`}
                  className="text-xs text-primary"
                >
                  Timeline
                </Link>
              }
            />
            {milestones.length ? (
              milestones.map((m) => (
                <div
                  className="flex items-start gap-3 border-b py-3 text-xs"
                  key={m.id}
                >
                  <span className="mt-1 size-2 rounded-full bg-primary/40" />
                  <div>
                    <p className="font-medium">{m.title}</p>
                    <p className="mt-1 text-muted-foreground">
                      {formatDate(m.due_date)} · {m.phase}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs leading-6 text-muted-foreground">
                No milestones scheduled yet. Add a decision date, design review,
                or permit target in Timeline.
              </p>
            )}
          </section>
          <section>
            <SectionHeader title="Project activity" />
            <ol className="space-y-4">
              {activity.map((a) => (
                <li key={a.id} className="border-l-2 border-primary/15 pl-3">
                  <p className="text-xs leading-5">{a.description}</p>
                  <time
                    className="text-[10px] text-muted-foreground"
                    dateTime={a.created_at}
                  >
                    {new Intl.DateTimeFormat("en-US", {
                      month: "short",
                      day: "numeric",
                      timeZone: "America/Los_Angeles",
                    }).format(new Date(a.created_at))}
                  </time>
                </li>
              ))}
            </ol>
            {!activity.length && (
              <p className="text-xs text-muted-foreground">
                New changes to tasks, documents, and your site concept will
                appear here.
              </p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
