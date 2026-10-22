import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { requireUser } from "@/lib/auth";
import {
  getProjectWorkspace,
  getProjectRegulations,
} from "@/lib/data/projects";
import {
  PageHeader,
  InformationPanel,
  SourceBadge,
  StatusBadge,
  TaskRow,
} from "@/components/workspace/primitives";
export default async function Feasibility({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const user = await requireUser();
  const [project, { sources }] = await Promise.all([
    getProjectWorkspace(projectId, user.id, "feasibility"),
    getProjectRegulations(projectId, user.id),
  ]);
  const p = project.properties[0],
    blocked = project.project_tasks.filter((t) => t.status === "blocked");
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Make the unknowns visible"
        title="Feasibility"
        description="A view of your information gaps and project blockers. Checklist completion alone does not establish whether a property can be developed."
      />
      <div className="rounded-2xl border bg-[#e9eedf] p-7">
        <SourceBadge type="unknown" />
        <h2 className="mt-5 text-2xl font-medium tracking-tight">
          More groundwork is needed.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
          Buildability has not been established. Verify the parcel, applicable
          rules, infrastructure, environmental constraints, design, and costs
          before making a development decision.
        </p>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <InformationPanel title="Information available">
          <dl className="space-y-4 text-xs">
            {[
              ["Property address", p ? "Provided" : "Missing"],
              [
                "Location",
                p?.latitude != null ? "Coordinates saved" : "Not yet available",
              ],
              [
                "Official regulatory sources",
                sources.length
                  ? String(sources.length) + " attached; needs review"
                  : "Not connected",
              ],
              ["Parcel boundary", "Not yet verified"],
              ["Setbacks & buildable envelope", "Not yet verified"],
              ["Environmental & utilities data", "Not connected"],
            ].map(([k, v]) => (
              <div className="flex justify-between gap-4 border-b pb-3" key={k}>
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="text-right">{v}</dd>
              </div>
            ))}
          </dl>
        </InformationPanel>
        <InformationPanel title="Suggested due diligence">
          <ol className="space-y-4 text-xs leading-6 text-muted-foreground">
            {[
              "Confirm legal parcel and ownership records.",
              "Obtain a survey and check easements, access, and utilities.",
              "Confirm zoning, uses, density, height, setbacks, and parking.",
              "Check flood, wetlands, slope, and environmental requirements.",
              "Review the concept and budget with qualified local professionals.",
            ].map((s, i) => (
              <li className="flex gap-3" key={s}>
                <span className="font-mono text-primary">0{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
          <Link
            className="button-secondary mt-6"
            href={`/projects/${projectId}/tasks`}
          >
            Work through due diligence
            <ArrowUpRight className="size-3.5" />
          </Link>
        </InformationPanel>
      </div>
      <section>
        <h2 className="mb-4 text-base font-semibold">Recorded blockers</h2>
        {blocked.length ? (
          blocked.map((t) => (
            <TaskRow
              key={t.id}
              title={t.title}
              category={t.notes ?? t.category}
              href={`/projects/${projectId}/tasks#task-${t.id}`}
            >
              <StatusBadge status={t.status} />
            </TaskRow>
          ))
        ) : (
          <p className="rounded-xl border p-5 text-xs leading-6 text-muted-foreground">
            No tasks are marked blocked. The information gaps above still need
            verification.
          </p>
        )}
      </section>
    </div>
  );
}
