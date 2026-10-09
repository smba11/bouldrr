import { ExternalLink, FileSearch, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getProjectWorkspace, getRegulationExample } from "@/lib/data/projects";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function RegulationsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const user = await requireUser();
  const project = await getProjectWorkspace(projectId, user.id);
  const { regulations, sources } = await getRegulationExample();
  const property = project.properties[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Regulations</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Official sources stay separate from Bouldrr explanations so users can
          see where every regulatory conclusion came from.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="size-4 text-emerald-700" />
              Jurisdiction
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            {property
              ? `${property.city}, ${property.state}${property.county ? `, ${property.county} County` : ""}`
              : "No property has been attached."}
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Official Sources</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {sources.length} source record{sources.length === 1 ? "" : "s"}
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Extracted Rules</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {regulations.length} rule summary
            {regulations.length === 1 ? "" : " summaries"}
          </CardContent>
        </Card>
      </div>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Rule Register</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {regulations.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                No regulation summaries exist yet. In v0.3 this page becomes
                the local zoning and permit intelligence engine.
              </div>
            ) : (
              regulations.map((rule) => (
                <article className="rounded-lg border p-4" key={rule.id}>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <Badge variant="secondary">{rule.category}</Badge>
                      <h2 className="mt-2 text-lg font-medium">{rule.title}</h2>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Updated {formatDate(rule.updated_at.slice(0, 10))}
                    </p>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg bg-muted/40 p-3">
                      <p className="text-sm font-medium">Official Rule</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {rule.raw_reference ?? "Source record reference needed."}
                      </p>
                    </div>
                    <div className="rounded-lg bg-sky-50 p-3 text-sky-950">
                      <p className="text-sm font-medium">Bouldrr Explanation</p>
                      <p className="mt-1 text-sm">{rule.summary}</p>
                    </div>
                  </div>
                </article>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="h-fit shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSearch className="size-5" />
              Source Library
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sources.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Attach official planning, zoning, building, inspection, and fee
                sources before relying on local answers.
              </p>
            ) : (
              sources.map((source) => (
                <div className="rounded-lg border p-3" key={source.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{source.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {source.publisher ?? source.source_type}
                      </p>
                    </div>
                    <Button asChild size="icon-sm" variant="outline">
                      <a href={source.url} rel="noreferrer" target="_blank">
                        <ExternalLink className="size-4" />
                        <span className="sr-only">Open source</span>
                      </a>
                    </Button>
                  </div>
                  <dl className="mt-3 grid gap-2 text-xs text-muted-foreground">
                    <div>
                      <dt className="font-medium text-foreground">Effective</dt>
                      <dd>{formatDate(source.effective_date)}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-foreground">Last verified</dt>
                      <dd>
                        {source.last_checked_at
                          ? formatDate(source.last_checked_at.slice(0, 10))
                          : "Not verified"}
                      </dd>
                    </div>
                  </dl>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
