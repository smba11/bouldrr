import Link from "next/link";
import {
  Bot,
  CalendarClock,
  ClipboardList,
  FileText,
  MapPin,
  Scale,
  WalletCards,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getProjectWorkspace, getRegulationExample } from "@/lib/data/projects";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const user = await requireUser();
  const project = await getProjectWorkspace(projectId, user.id);
  const { regulations, sources } = await getRegulationExample();
  const property = project.properties[0];
  const completedTasks = project.project_tasks.filter(
    (task) => task.status === "complete",
  ).length;
  const blockedTasks = project.project_tasks.filter(
    (task) => task.status === "blocked",
  ).length;
  const estimatedCost = project.project_costs.reduce(
    (total, cost) => total + cost.estimated_amount,
    0,
  );
  const completeMilestones = project.project_milestones.filter(
    (milestone) => milestone.status === "complete",
  ).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <Badge variant="secondary">{project.project_type}</Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            {project.name}
          </h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            {project.description}
          </p>
        </div>
        <Button asChild>
          <Link href={`/projects/${project.id}/copilot`}>
            <Bot className="size-4" />
            Ask Copilot
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="size-4" />
              Property
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {property
              ? `${property.address_line_1}, ${property.city}, ${property.state} ${property.postal_code}`
              : "No property information yet."}
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="size-4" />
              Tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {completedTasks} of {project.project_tasks.length} complete
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Scale className="size-4" />
              Feasibility
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {blockedTasks > 0
              ? `${blockedTasks} blocker${blockedTasks === 1 ? "" : "s"}`
              : "No blocked tasks"}
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4" />
              Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {project.documents.length} uploaded
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <WalletCards className="size-4" />
              Costs
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {formatCurrency(estimatedCost)} estimated
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="size-4" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {completeMilestones} of {project.project_milestones.length} milestones complete
          </CardContent>
        </Card>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Official Source</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {sources.length === 0 ? (
              <p className="text-muted-foreground">
                No official sources are attached to this jurisdiction yet. Add
                local planning, zoning, and building department sources before
                relying on summaries.
              </p>
            ) : (
              sources.map((source) => (
                <a
                  className="block rounded-lg border p-3 hover:bg-muted/40"
                  href={source.url}
                  key={source.id}
                  rel="noreferrer"
                  target="_blank"
                >
                  <span className="font-medium">{source.title}</span>
                  <span className="mt-1 block text-muted-foreground">
                    {source.publisher ?? source.source_type}
                  </span>
                </a>
              ))
            )}
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Bouldrr Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {regulations.length === 0 ? (
              <p className="text-muted-foreground">
                Jurisdiction-specific rules have not been extracted for this
                project yet.
              </p>
            ) : (
              regulations.map((rule) => (
                <div className="rounded-lg border p-3" key={rule.id}>
                  <p className="font-medium">{rule.title}</p>
                  <p className="mt-1 text-muted-foreground">{rule.summary}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Reference: {rule.raw_reference ?? "Source record"}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
