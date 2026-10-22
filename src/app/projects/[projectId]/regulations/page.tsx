import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getProjectShell, getProjectRegulations } from "@/lib/data/projects";
import {
  PageHeader,
  EmptyState,
  InformationPanel,
  SourceBadge,
} from "@/components/workspace/primitives";
import { formatDate } from "@/lib/format";
export default async function RegulationsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const user = await requireUser();
  const [project, { regulations, sources }] = await Promise.all([
    getProjectShell(projectId, user.id),
    getProjectRegulations(projectId, user.id),
  ]);
  const p = project.properties[0];
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Local rules, with a paper trail"
        title="Zoning & regulations"
        description="Official sources and plain-language explanations stay distinct. A summary is never presented as law."
      />
      <div className="flex flex-wrap justify-between gap-4 rounded-xl border bg-white p-5">
        <div>
          <p className="eyebrow">Address context</p>
          <p className="mt-2 text-sm font-medium">
            {[p?.city, p?.county, p?.state].filter(Boolean).join(" · ") ||
              "Not yet available"}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Regulatory authority has not been confirmed from the address alone.
          </p>
        </div>
        <SourceBadge type="user" />
      </div>
      {regulations.length ? (
        <div className="space-y-5">
          {regulations.map((rule) => {
            const source = sources.find((s) => s.id === rule.source_id);
            return (
              <article key={rule.id} className="rounded-xl border bg-white p-6">
                <div className="flex flex-wrap justify-between gap-3">
                  <h2 className="text-lg font-medium">{rule.title}</h2>
                  <span className="source-badge">
                    {source?.verification_status === "verified"
                      ? "Verified"
                      : source &&
                          source.verification_status !== "missing_source"
                        ? "Needs Review"
                        : "Missing Source"}
                  </span>
                </div>
                <div className="mt-6 grid gap-6 md:grid-cols-3">
                  <section>
                    <p className="eyebrow">Official source</p>
                    {source ? (
                      <>
                        <a
                          className="mt-3 block text-sm font-medium text-primary hover:underline"
                          href={
                            /^https?:\/\//.test(source.url)
                              ? source.url
                              : undefined
                          }
                          target="_blank"
                          rel="noreferrer"
                        >
                          {source.title}{" "}
                          <ArrowUpRight className="inline size-3.5" />
                        </a>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {source.publisher || "Agency not yet available"}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Effective: {formatDate(source.effective_date)}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Last checked:{" "}
                          {source.last_checked_at
                            ? formatDate(source.last_checked_at.slice(0, 10))
                            : "Not yet checked"}
                        </p>
                      </>
                    ) : (
                      <p className="mt-3 text-xs text-muted-foreground">
                        No official source attached.
                      </p>
                    )}
                    <p className="mt-3 text-xs leading-6 text-muted-foreground">
                      {rule.raw_reference ||
                        "Original provision not yet available."}
                    </p>
                  </section>
                  <section className="rounded-xl bg-muted/60 p-4">
                    <p className="eyebrow">Bouldrr summary</p>
                    <p className="mt-3 text-sm leading-7">{rule.summary}</p>
                    <p className="mt-3">
                      <SourceBadge type="derived" />
                    </p>
                  </section>
                  <section>
                    <p className="eyebrow">Project impact</p>
                    <p className="mt-3 text-xs leading-6 text-muted-foreground">
                      Applicability to this {project.project_type.toLowerCase()}{" "}
                      project has not been reviewed. Confirm the provision,
                      effective date, and responsible authority before using it
                      in your plan.
                    </p>
                  </section>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="Local rules need a local source."
          description="No jurisdiction-matched regulations are connected to this property yet. Confirm the planning authority, then save zoning maps, code excerpts, and permit checklists in Documents."
          action={
            <Link
              className="button-primary"
              href={`/projects/${projectId}/documents`}
            >
              Add source documents <ArrowUpRight className="size-3.5" />
            </Link>
          }
        />
      )}
      <InformationPanel title="A source-backed research path">
        <ol className="grid gap-5 text-xs leading-6 text-muted-foreground sm:grid-cols-3">
          <li>
            <span className="mb-2 block font-medium text-foreground">
              01 · Confirm the authority
            </span>
            City limits and county addresses don’t always establish who reviews
            a parcel.
          </li>
          <li>
            <span className="mb-2 block font-medium text-foreground">
              02 · Find the original rule
            </span>
            Collect the official district map, applicable code sections, agency,
            and dates.
          </li>
          <li>
            <span className="mb-2 block font-medium text-foreground">
              03 · Review your specific goal
            </span>
            Check use, density, height, parking, setbacks, and review
            requirements with the authority.
          </li>
        </ol>
      </InformationPanel>
    </div>
  );
}
